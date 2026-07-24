from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from accounts.permissions import IsFinance, IsProcurement, IsAdmin
from .queries import (
    get_total_spend_summary,
    get_spend_by_department,
    get_spend_by_month,
    get_spend_by_quarter,
    get_spend_by_category,
    get_vendor_performance_summary,
    get_vendor_bid_comparison,
    get_procurement_pipeline_summary,
    get_approval_turnaround_time,
    get_rfq_to_po_cycle_time,
    get_invoice_status_summary,
    get_overdue_invoices_report,
    get_payment_method_breakdown,
)
from .serializers import DateRangeSerializer
from .tasks import (
    generate_spend_report_excel_task,
    generate_vendor_report_task,
    generate_spend_pdf_task,
)
from .report_generators import (
    generate_spend_excel_report,
    generate_vendor_performance_excel,
    generate_spend_pdf_report,
)


class SpendSummaryView(APIView):
    permission_classes = [IsFinance]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        data = get_total_spend_summary(
            start_date=serializer.validated_data.get('start_date'),
            end_date=serializer.validated_data.get('end_date')
        )
        return Response(data)


class SpendByDepartmentView(APIView):
    permission_classes = [IsFinance]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        data = get_spend_by_department(
            start_date=serializer.validated_data.get('start_date'),
            end_date=serializer.validated_data.get('end_date')
        )
        return Response(list(data))


class SpendByMonthView(APIView):
    permission_classes = [IsFinance]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        year = serializer.validated_data.get('year')
        data = get_spend_by_month(year=year)

        result = []
        for item in data:
            result.append({
                'month': item['month'].strftime('%B %Y'),
                'total_spend': str(item['total_spend']),
                'transaction_count': item['transaction_count']
            })
        return Response(result)


class SpendByQuarterView(APIView):
    permission_classes = [IsFinance]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        year = serializer.validated_data.get('year')
        data = get_spend_by_quarter(year=year)

        result = []
        for item in data:
            result.append({
                'quarter': item['quarter'].strftime('%B %Y'),
                'total_spend': str(item['total_spend']),
                'transaction_count': item['transaction_count']
            })
        return Response(result)


class SpendByCategoryView(APIView):
    permission_classes = [IsFinance]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        data = get_spend_by_category(
            start_date=serializer.validated_data.get('start_date'),
            end_date=serializer.validated_data.get('end_date')
        )
        return Response(list(data))


class VendorPerformanceView(APIView):
    permission_classes = [IsProcurement]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        data = get_vendor_performance_summary(
            start_date=serializer.validated_data.get('start_date'),
            end_date=serializer.validated_data.get('end_date')
        )
        return Response(data)


class VendorBidComparisonView(APIView):
    permission_classes = [IsProcurement]

    def get(self, request):
        rfq_id = request.query_params.get('rfq_id')
        if not rfq_id:
            return Response({"error": "rfq_id is required."}, status=400)

        data = get_vendor_bid_comparison(rfq_id)
        if data is None:
            return Response({"error": "RFQ not found."}, status=404)

        return Response(data)


class ProcurementPipelineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pipeline = get_procurement_pipeline_summary()
        turnaround = get_approval_turnaround_time()
        cycle_time = get_rfq_to_po_cycle_time()

        return Response({
            'pipeline': pipeline,
            'approval_turnaround': turnaround,
            'rfq_to_po_cycle': cycle_time,
        })


class InvoiceReportView(APIView):
    permission_classes = [IsFinance]

    def get(self, request):
        status_summary = list(get_invoice_status_summary())
        overdue = get_overdue_invoices_report()
        payment_methods = list(get_payment_method_breakdown())

        # Convert decimals to string for JSON safety
        for item in status_summary:
            item['total_amount'] = str(item['total_amount'] or 0)
            item['avg_amount'] = str(item['avg_amount'] or 0)

        for item in payment_methods:
            item['total_amount'] = str(item['total_amount'] or 0)

        return Response({
            'by_status': status_summary,
            'overdue_invoices': overdue,
            'payment_methods': payment_methods,
        })


class OverdueInvoicesView(APIView):
    permission_classes = [IsFinance]

    def get(self, request):
        data = get_overdue_invoices_report()
        return Response({
            'total_overdue': len(data),
            'invoices': data
        })


class RequestSpendReportView(APIView):
    """Queue async Excel report generation"""
    permission_classes = [IsFinance]

    def post(self, request):
        serializer = DateRangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        start_date = str(serializer.validated_data.get('start_date') or '')
        end_date = str(serializer.validated_data.get('end_date') or '')

        task = generate_spend_report_excel_task.delay(
            start_date=start_date or None,
            end_date=end_date or None,
            user_email=request.user.email
        )

        return Response({
            "message": "Report generation started. You will receive an email when ready.",
            "task_id": task.id
        })


class DownloadSpendReportView(APIView):
    """Instant Excel download (sync — for small datasets)"""
    permission_classes = [IsFinance]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        excel_bytes = generate_spend_excel_report(
            start_date=serializer.validated_data.get('start_date'),
            end_date=serializer.validated_data.get('end_date')
        )

        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="spend_report.xlsx"'
        return response


class DownloadVendorReportView(APIView):
    """Instant vendor performance Excel download"""
    permission_classes = [IsProcurement]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        excel_bytes = generate_vendor_performance_excel(
            start_date=serializer.validated_data.get('start_date'),
            end_date=serializer.validated_data.get('end_date')
        )

        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="vendor_performance.xlsx"'
        return response


class DownloadSpendPDFView(APIView):
    """Instant PDF spend report download"""
    permission_classes = [IsFinance]

    def get(self, request):
        serializer = DateRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        pdf_bytes = generate_spend_pdf_report(
            start_date=serializer.validated_data.get('start_date'),
            end_date=serializer.validated_data.get('end_date')
        )

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="spend_report.pdf"'
        return response


class TaskStatusView(APIView):
    """Check async task status"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id):
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        return Response({
            'task_id': task_id,
            'status': result.status,
            'result': result.result if result.ready() else None
        })

