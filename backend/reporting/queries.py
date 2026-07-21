from django.db.models import (
    Sum, Count, Avg, Min, Max,
    F, Q, ExpressionWrapper,
    DecimalField, DurationField,
    FloatField
)
from django.db.models.functions import (
    TruncMonth, TruncQuarter,
    TruncYear, Coalesce, ExtractDay
)
from django.utils import timezone
from datetime import timedelta
from procurement.models import (
    PurchaseRequest, PurchaseOrder,
    Invoice, Bid, RFQ, Vendor, Payment
)


# SPEND ANALYTICS

def get_total_spend_summary(start_date=None, end_date=None):
    """Overall spend summary across all paid invoices"""
    qs = Payment.objects.select_related('invoice__purchase_order')

    if start_date:
        qs = qs.filter(payment_date__gte=start_date)
    if end_date:
        qs = qs.filter(payment_date__lte=end_date)

    stats = qs.aggregate(
        total_spend=Coalesce(Sum('amount_paid'), 0),
        total_transactions=Count('id'),
        average_transaction=Coalesce(Avg('amount_paid'), 0),
        largest_payment=Coalesce(Max('amount_paid'), 0),
        smallest_payment=Coalesce(Min('amount_paid'), 0),
    )
    return stats


def get_spend_by_department(start_date=None, end_date=None):
    """Total spend grouped by department"""
    qs = Payment.objects.select_related(
        'invoice__purchase_order__purchase_request__department'
    )

    if start_date:
        qs = qs.filter(payment_date__gte=start_date)
    if end_date:
        qs = qs.filter(payment_date__lte=end_date)

    return qs.values(
        department_name=F('invoice__purchase_order__purchase_request__department__name')
    ).annotate(
        total_spend=Sum('amount_paid'),
        transaction_count=Count('id'),
        average_spend=Avg('amount_paid')
    ).order_by('-total_spend')


def get_spend_by_month(year=None):
    """Monthly spend trend"""
    if not year:
        year = timezone.now().year

    return Payment.objects.filter(
        payment_date__year=year
    ).annotate(
        month=TruncMonth('payment_date')
    ).values('month').annotate(
        total_spend=Sum('amount_paid'),
        transaction_count=Count('id')
    ).order_by('month')


def get_spend_by_quarter(year=None):
    """Quarterly spend breakdown"""
    if not year:
        year = timezone.now().year

    return Payment.objects.filter(
        payment_date__year=year
    ).annotate(
        quarter=TruncQuarter('payment_date')
    ).values('quarter').annotate(
        total_spend=Sum('amount_paid'),
        transaction_count=Count('id')
    ).order_by('quarter')


def get_spend_by_category(start_date=None, end_date=None):
    """Spend grouped by vendor category"""
    qs = Payment.objects.select_related(
        'invoice__vendor'
    ).prefetch_related(
        'invoice__vendor__categories'
    )

    if start_date:
        qs = qs.filter(payment_date__gte=start_date)
    if end_date:
        qs = qs.filter(payment_date__lte=end_date)

    return qs.values(
        category=F('invoice__vendor__categories__name')
    ).annotate(
        total_spend=Sum('amount_paid'),
        transaction_count=Count('id')
    ).exclude(category=None).order_by('-total_spend')


# VENDOR PERFORMANCE

def get_vendor_performance_summary(start_date=None, end_date=None):
    """Overall vendor performance metrics"""
    qs = Vendor.objects.filter(status='ACTIVE').prefetch_related(
        'bids', 'purchase_orders', 'invoices'
    )

    result = []
    for vendor in qs:
        bids = vendor.bids.all()
        pos = vendor.purchase_orders.all()
        invoices = vendor.invoices.all()

        if start_date:
            bids = bids.filter(submitted_at__gte=start_date)
            pos = pos.filter(created_at__gte=start_date)
            invoices = invoices.filter(submitted_at__gte=start_date)

        total_bids = bids.count()
        awarded_bids = bids.filter(status='AWARDED').count()
        win_rate = round((awarded_bids / total_bids * 100), 2) if total_bids > 0 else 0

        total_pos = pos.count()
        delivered_pos = pos.filter(status='DELIVERED').count()
        on_time_rate = round((delivered_pos / total_pos * 100), 2) if total_pos > 0 else 0

        total_invoiced = invoices.aggregate(
            total=Coalesce(Sum('amount'), 0)
        )['total']

        result.append({
            'vendor_id': vendor.id,
            'company_name': vendor.company_name,
            'city': vendor.city,
            'country': vendor.country,
            'rating': float(vendor.rating),
            'total_bids': total_bids,
            'awarded_bids': awarded_bids,
            'win_rate_percent': win_rate,
            'total_purchase_orders': total_pos,
            'delivered_orders': delivered_pos,
            'delivery_rate_percent': on_time_rate,
            'total_invoiced_amount': float(total_invoiced),
        })

    return sorted(result, key=lambda x: x['total_invoiced_amount'], reverse=True)


def get_vendor_bid_comparison(rfq_id):
    """Detailed bid comparison for a specific RFQ"""
    from procurement.models import RFQ
    try:
        rfq = RFQ.objects.get(id=rfq_id)
    except RFQ.DoesNotExist:
        return None

    bids = rfq.bids.select_related('vendor').order_by('total_amount')
    budget = rfq.purchase_request.estimated_budget

    result = []
    for rank, bid in enumerate(bids, start=1):
        savings = budget - bid.total_amount
        result.append({
            'rank': rank,
            'vendor': bid.vendor.company_name,
            'total_amount': float(bid.total_amount),
            'delivery_days': bid.delivery_days,
            'status': bid.status,
            'savings_vs_budget': float(savings),
            'savings_percent': round(float(savings / budget * 100), 2) if budget > 0 else 0,
            'submitted_at': bid.submitted_at,
        })

    return {
        'rfq_number': rfq.rfq_number,
        'title': rfq.title,
        'estimated_budget': float(budget),
        'deadline': rfq.deadline,
        'total_bids': bids.count(),
        'bids': result
    }


# PROCUREMENT PIPELINE

def get_procurement_pipeline_summary():
    """Current state of all requests across the pipeline"""
    status_counts = PurchaseRequest.objects.values(
        'status'
    ).annotate(
        count=Count('id'),
        total_budget=Sum('estimated_budget')
    ).order_by('status')

    return {
        item['status']: {
            'count': item['count'],
            'total_budget': float(item['total_budget'] or 0)
        }
        for item in status_counts
    }


def get_approval_turnaround_time():
    """Average time from request creation to first approval action"""
    from procurement.models import Approval

    approvals = Approval.objects.select_related(
        'request'
    ).annotate(
        turnaround=ExpressionWrapper(
            F('created_at') - F('request__created_at'),
            output_field=DurationField()
        )
    )

    result = approvals.aggregate(
        avg_hours=Avg(
            ExpressionWrapper(
                ExtractDay(F('created_at') - F('request__created_at')) * 24,
                output_field=FloatField()
            )
        )
    )

    return {
        'average_approval_hours': round(result['avg_hours'] or 0, 2),
        'total_approvals': approvals.count()
    }


def get_rfq_to_po_cycle_time():
    """Average time from RFQ creation to PO generation"""
    pos = PurchaseOrder.objects.select_related(
        'purchase_request__rfq'
    ).filter(
        purchase_request__rfq__isnull=False
    )

    total_hours = 0
    count = 0

    for po in pos:
        rfq = po.purchase_request.rfq
        if rfq:
            delta = po.created_at - rfq.created_at
            total_hours += delta.total_seconds() / 3600
            count += 1

    avg_hours = round(total_hours / count, 2) if count > 0 else 0

    return {
        'average_cycle_hours': avg_hours,
        'total_pos_analyzed': count
    }


# INVOICE & PAYMENT ANALYTICS

def get_invoice_status_summary():
    """Invoice counts and values by status"""
    return Invoice.objects.values('status').annotate(
        count=Count('id'),
        total_amount=Sum('amount'),
        avg_amount=Avg('amount')
    ).order_by('status')


def get_overdue_invoices_report():
    """All overdue invoices with days overdue"""
    today = timezone.now().date()

    overdue = Invoice.objects.filter(
        due_date__lt=today,
        status__in=['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
    ).select_related('vendor', 'purchase_order')

    result = []
    for inv in overdue:
        days_overdue = (today - inv.due_date).days
        result.append({
            'invoice_number': inv.invoice_number,
            'vendor': inv.vendor.company_name,
            'po_number': inv.purchase_order.po_number,
            'amount': float(inv.amount),
            'due_date': inv.due_date,
            'days_overdue': days_overdue,
            'status': inv.status,
        })

    return sorted(result, key=lambda x: x['days_overdue'], reverse=True)


def get_payment_method_breakdown():
    """Payments grouped by method"""
    return Payment.objects.values(
        'payment_method'
    ).annotate(
        count=Count('id'),
        total_amount=Sum('amount_paid')
    ).order_by('-total_amount')