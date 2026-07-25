from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from procurement.models import (
    PurchaseRequest, PurchaseOrder,
    Invoice, Vendor, RFQ, Bid, Payment
)


def get_dashboard_data(user):
    """
    Returns dashboard data scoped to user role.
    Each role sees different metrics.
    """
    now = timezone.now()
    today = now.date()
    thirty_days_ago = now - timedelta(days=30)

    base = {
        'generated_at': now.isoformat(),
        'user_role': user.role,
    }

    if user.role == 'EMPLOYEE':
        return {**base, **get_employee_dashboard(user)}
    elif user.role == 'MANAGER':
        return {**base, **get_manager_dashboard(user)}
    elif user.role == 'PROCUREMENT':
        return {**base, **get_procurement_dashboard()}
    elif user.role == 'FINANCE':
        return {**base, **get_finance_dashboard()}
    elif user.role == 'VENDOR':
        return {**base, **get_vendor_dashboard(user)}
    elif user.role == 'ADMIN':
        return {**base, **get_admin_dashboard()}
    return base


def get_employee_dashboard(user):
    requests = PurchaseRequest.objects.filter(requester=user)
    return {
        'my_requests': {
            'total': requests.count(),
            'pending': requests.filter(status='PENDING_APPROVAL').count(),
            'approved': requests.filter(status='APPROVED').count(),
            'rejected': requests.filter(status='REJECTED').count(),
            'completed': requests.filter(status='COMPLETED').count(),
        },
        'recent_requests': list(
            requests.order_by('-created_at')[:5].values(
                'id', 'title', 'status',
                'estimated_budget', 'created_at'
            )
        )
    }


def get_manager_dashboard(user):
    dept_requests = PurchaseRequest.objects.filter(
        department=user.department
    )
    return {
        'department': user.department.name if user.department else None,
        'pending_approvals': dept_requests.filter(
            status='PENDING_APPROVAL'
        ).count(),
        'department_requests': {
            'total': dept_requests.count(),
            'this_month': dept_requests.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'total_budget_requested': dept_requests.aggregate(
                total=Sum('estimated_budget')
            )['total'] or 0,
        },
        'requests_by_status': list(
            dept_requests.values('status').annotate(
                count=Count('id')
            )
        ),
        'recent_pending': list(
            dept_requests.filter(
                status='PENDING_APPROVAL'
            ).order_by('-created_at')[:5].values(
                'id', 'title', 'estimated_budget', 'created_at'
            )
        )
    }


def get_procurement_dashboard():
    now = timezone.now()
    today = now.date()

    open_rfqs = RFQ.objects.filter(status='OPEN')
    pos = PurchaseOrder.objects.all()

    return {
        'rfqs': {
            'open': open_rfqs.count(),
            'closing_soon': open_rfqs.filter(
                deadline__lte=now + timedelta(days=3)
            ).count(),
            'total_bids_received': Bid.objects.filter(
                rfq__status='OPEN'
            ).count(),
        },
        'purchase_orders': {
            'total': pos.count(),
            'draft': pos.filter(status='DRAFT').count(),
            'sent': pos.filter(status='SENT').count(),
            'acknowledged': pos.filter(status='ACKNOWLEDGED').count(),
            'in_progress': pos.filter(status='IN_PROGRESS').count(),
            'delivered': pos.filter(status='DELIVERED').count(),
            'overdue_delivery': pos.filter(
                expected_delivery_date__lt=today,
                status__in=['SENT', 'ACKNOWLEDGED', 'IN_PROGRESS']
            ).count(),
        },
        'requests_pipeline': list(
            PurchaseRequest.objects.values('status').annotate(
                count=Count('id'),
                total_value=Sum('estimated_budget')
            )
        ),
        'recent_rfqs': list(
            RFQ.objects.filter(
                status='OPEN'
            ).order_by('deadline')[:5].values(
                'id', 'rfq_number', 'title',
                'deadline', 'status'
            )
        )
    }


def get_finance_dashboard():
    today = timezone.now().date()
    invoices = Invoice.objects.all()

    overdue = invoices.filter(
        due_date__lt=today,
        status__in=['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
    )

    this_month_payments = Payment.objects.filter(
        payment_date__month=today.month,
        payment_date__year=today.year
    )

    return {
        'invoices': {
            'submitted': invoices.filter(status='SUBMITTED').count(),
            'under_review': invoices.filter(status='UNDER_REVIEW').count(),
            'approved': invoices.filter(status='APPROVED').count(),
            'paid': invoices.filter(status='PAID').count(),
            'rejected': invoices.filter(status='REJECTED').count(),
            'overdue': overdue.count(),
        },
        'overdue_amount': float(
            overdue.aggregate(
                total=Sum('amount')
            )['total'] or 0
        ),
        'this_month': {
            'payments_processed': this_month_payments.count(),
            'total_paid': float(
                this_month_payments.aggregate(
                    total=Sum('amount_paid')
                )['total'] or 0
            ),
        },
        'recent_invoices': list(
            invoices.filter(
                status__in=['SUBMITTED', 'UNDER_REVIEW']
            ).order_by('due_date')[:5].values(
                'id', 'invoice_number',
                'amount', 'due_date', 'status'
            )
        )
    }


def get_vendor_dashboard(user):
    try:
        vendor = user.vendor_profile
    except Exception:
        return {'error': 'No vendor profile found.'}

    bids = Bid.objects.filter(vendor=vendor)
    pos = PurchaseOrder.objects.filter(vendor=vendor)
    invoices = Invoice.objects.filter(vendor=vendor)

    total_bids = bids.count()
    won_bids = bids.filter(status='AWARDED').count()

    return {
        'vendor_status': vendor.status,
        'company_name': vendor.company_name,
        'bids': {
            'total': total_bids,
            'won': won_bids,
            'win_rate': round(won_bids / total_bids * 100, 2) if total_bids > 0 else 0,
            'pending': bids.filter(status='SUBMITTED').count(),
        },
        'purchase_orders': {
            'total': pos.count(),
            'pending_acknowledgment': pos.filter(status='SENT').count(),
            'in_progress': pos.filter(status='IN_PROGRESS').count(),
            'delivered': pos.filter(status='DELIVERED').count(),
        },
        'invoices': {
            'total': invoices.count(),
            'submitted': invoices.filter(status='SUBMITTED').count(),
            'approved': invoices.filter(status='APPROVED').count(),
            'paid': invoices.filter(status='PAID').count(),
            'total_earned': float(
                invoices.filter(
                    status='PAID'
                ).aggregate(
                    total=Sum('amount')
                )['total'] or 0
            ),
        },
        'open_rfqs': RFQ.objects.filter(
            status='OPEN',
            invited_vendors=vendor
        ).count(),
    }


def get_admin_dashboard():
    today = timezone.now().date()

    return {
        'system_overview': {
            'total_users': __import__(
                'django.contrib.auth', fromlist=['get_user_model']
            ).get_user_model().objects.count(),
            'active_vendors': Vendor.objects.filter(status='ACTIVE').count(),
            'pending_vendor_verification': Vendor.objects.filter(
                status='PENDING'
            ).count(),
            'total_requests': PurchaseRequest.objects.count(),
            'total_pos': PurchaseOrder.objects.count(),
            'total_invoices': Invoice.objects.count(),
        },
        'financial_summary': {
            'total_spend': float(
                Payment.objects.aggregate(
                    total=Sum('amount_paid')
                )['total'] or 0
            ),
            'pending_invoice_value': float(
                Invoice.objects.filter(
                    status__in=['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
                ).aggregate(
                    total=Sum('amount')
                )['total'] or 0
            ),
            'overdue_invoices': Invoice.objects.filter(
                due_date__lt=today,
                status__in=['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
            ).count(),
        },
        'pipeline_health': list(
            PurchaseRequest.objects.values('status').annotate(
                count=Count('id')
            )
        ),
    }