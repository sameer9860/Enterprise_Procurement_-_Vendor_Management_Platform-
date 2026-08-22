from django.urls import path
from django.http import JsonResponse
from .views import (
    SpendSummaryView,
    SpendByDepartmentView,
    SpendByMonthView,
    SpendByQuarterView,
    SpendByCategoryView,
    VendorPerformanceView,
    VendorBidComparisonView,
    ProcurementPipelineView,
    InvoiceReportView,
    OverdueInvoicesView,
    RequestSpendReportView,
    DownloadSpendReportView,
    DownloadVendorReportView,
    DownloadSpendPDFView,
    TaskStatusView,
    DashboardView,
)

def reports_root(request):
    return JsonResponse({
        'message': 'Reporting & Analytics API',
        'endpoints': {
            'dashboard': '/api/reports/dashboard/',
            'spend_summary': '/api/reports/spend/summary/',
            'spend_by_department': '/api/reports/spend/by-department/',
            'spend_by_month': '/api/reports/spend/by-month/',
            'spend_by_quarter': '/api/reports/spend/by-quarter/',
            'spend_by_category': '/api/reports/spend/by-category/',
            'vendor_performance': '/api/reports/vendors/performance/',
            'vendor_bid_comparison': '/api/reports/vendors/bid-comparison/',
            'pipeline': '/api/reports/pipeline/',
            'invoices': '/api/reports/invoices/',
            'overdue_invoices': '/api/reports/invoices/overdue/',
            'download_spend_excel': '/api/reports/download/spend/excel/',
            'download_spend_pdf': '/api/reports/download/spend/pdf/',
            'download_vendors_excel': '/api/reports/download/vendors/excel/',
        }
    })

urlpatterns = [
    path('', reports_root, name='reports_root'),
    # Spend reports
    path('spend/summary/', SpendSummaryView.as_view(), name='spend-summary'),
    path('spend/by-department/', SpendByDepartmentView.as_view(), name='spend-department'),
    path('spend/by-month/', SpendByMonthView.as_view(), name='spend-month'),
    path('spend/by-quarter/', SpendByQuarterView.as_view(), name='spend-quarter'),
    path('spend/by-category/', SpendByCategoryView.as_view(), name='spend-category'),

    # Vendor reports
    path('vendors/performance/', VendorPerformanceView.as_view(), name='vendor-performance'),
    path('vendors/bid-comparison/', VendorBidComparisonView.as_view(), name='vendor-bid-comparison'),

    # Pipeline
    path('pipeline/', ProcurementPipelineView.as_view(), name='procurement-pipeline'),

    # Invoice reports
    path('invoices/', InvoiceReportView.as_view(), name='invoice-report'),
    path('invoices/overdue/', OverdueInvoicesView.as_view(), name='overdue-invoices'),

    # Report downloads
    path('download/spend/excel/', DownloadSpendReportView.as_view(), name='download-spend-excel'),
    path('download/spend/pdf/', DownloadSpendPDFView.as_view(), name='download-spend-pdf'),
    path('download/vendors/excel/', DownloadVendorReportView.as_view(), name='download-vendor-excel'),

    # Async report generation
    path('generate/spend/', RequestSpendReportView.as_view(), name='generate-spend-report'),

    # Task status
    path('tasks/<str:task_id>/', TaskStatusView.as_view(), name='task-status'),

    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]