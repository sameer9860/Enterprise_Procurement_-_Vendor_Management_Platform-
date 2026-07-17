from celery import shared_task
from .emails import send_email
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────
# PURCHASE REQUEST NOTIFICATIONS
# ─────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_manager_new_request(self, request_id):
    """Notify manager when new purchase request is submitted"""
    try:
        from procurement.models import PurchaseRequest
        from django.contrib.auth import get_user_model
        User = get_user_model()

        pr = PurchaseRequest.objects.select_related(
            'requester', 'department'
        ).get(id=request_id)

        # Get all managers in the department
        managers = User.objects.filter(
            role='MANAGER',
            department=pr.department
        )

        if not managers.exists():
            logger.warning(f"No managers found for department {pr.department}")
            return

        for manager in managers:
            if not manager.email:
                continue
            send_email(
                subject=f"[Action Required] New Purchase Request: {pr.title}",
                template_name='request_submitted.html',
                context={
                    'manager_name': manager.get_full_name() or manager.username,
                    'request_title': pr.title,
                    'requester_name': pr.requester.get_full_name() or pr.requester.username,
                    'department': pr.department.name,
                    'estimated_budget': pr.estimated_budget,
                    'submitted_at': pr.created_at.strftime('%d %b %Y %H:%M'),
                },
                recipient_list=[manager.email]
            )

    except Exception as exc:
        logger.error(f"notify_manager_new_request failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_requester_approval_action(self, request_id, action, comments=''):
    """Notify requester when their request is approved/rejected/changes requested"""
    try:
        from procurement.models import PurchaseRequest
        pr = PurchaseRequest.objects.select_related(
            'requester', 'department'
        ).get(id=request_id)

        if not pr.requester.email:
            return

        latest_approval = pr.approvals.order_by('-created_at').first()
        approver_name = latest_approval.approver.get_full_name() or latest_approval.approver.username if latest_approval else 'System'

        if action == 'APPROVED':
            send_email(
                subject=f"[Approved] Your request '{pr.title}' has been approved",
                template_name='request_approved.html',
                context={
                    'requester_name': pr.requester.get_full_name() or pr.requester.username,
                    'request_title': pr.title,
                    'approved_by': approver_name,
                    'estimated_budget': pr.estimated_budget,
                    'approved_at': pr.updated_at.strftime('%d %b %Y %H:%M'),
                },
                recipient_list=[pr.requester.email]
            )
        elif action == 'REJECTED':
            send_email(
                subject=f"[Rejected] Your request '{pr.title}' has been rejected",
                template_name='request_rejected.html',
                context={
                    'requester_name': pr.requester.get_full_name() or pr.requester.username,
                    'request_title': pr.title,
                    'rejected_by': approver_name,
                    'comments': comments or 'No comments provided.',
                },
                recipient_list=[pr.requester.email]
            )

    except Exception as exc:
        logger.error(f"notify_requester_approval_action failed: {exc}")
        raise self.retry(exc=exc)


# ─────────────────────────────────────────
# RFQ NOTIFICATIONS
# ─────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_vendors_rfq_created(self, rfq_id):
    """Notify all invited vendors when RFQ is created"""
    try:
        from procurement.models import RFQ
        rfq = RFQ.objects.select_related(
            'purchase_request'
        ).prefetch_related('invited_vendors__user').get(id=rfq_id)

        for vendor in rfq.invited_vendors.all():
            if not vendor.user.email:
                continue
            send_email(
                subject=f"[RFQ Invitation] {rfq.rfq_number} - {rfq.title}",
                template_name='rfq_created.html',
                context={
                    'vendor_name': vendor.company_name,
                    'rfq_number': rfq.rfq_number,
                    'rfq_title': rfq.title,
                    'deadline': rfq.deadline.strftime('%d %b %Y %H:%M'),
                    'estimated_budget': rfq.purchase_request.estimated_budget,
                },
                recipient_list=[vendor.user.email]
            )

    except Exception as exc:
        logger.error(f"notify_vendors_rfq_created failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_vendor_bid_awarded(self, bid_id):
    """Notify vendor when their bid is awarded"""
    try:
        from procurement.models import Bid
        bid = Bid.objects.select_related(
            'vendor__user', 'rfq'
        ).get(id=bid_id)

        if not bid.vendor.user.email:
            return

        send_email(
            subject=f"[Congratulations] Your bid for {bid.rfq.rfq_number} has been awarded",
            template_name='bid_awarded.html',
            context={
                'vendor_name': bid.vendor.company_name,
                'rfq_number': bid.rfq.rfq_number,
                'awarded_amount': bid.total_amount,
                'delivery_days': bid.delivery_days,
            },
            recipient_list=[bid.vendor.user.email]
        )

    except Exception as exc:
        logger.error(f"notify_vendor_bid_awarded failed: {exc}")
        raise self.retry(exc=exc)


# ─────────────────────────────────────────
# PURCHASE ORDER NOTIFICATIONS
# ─────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_vendor_po_sent(self, po_id):
    """Notify vendor when PO is sent to them"""
    try:
        from procurement.models import PurchaseOrder
        po = PurchaseOrder.objects.select_related(
            'vendor__user'
        ).get(id=po_id)

        if not po.vendor.user.email:
            return

        send_email(
            subject=f"[Purchase Order] {po.po_number} has been issued to you",
            template_name='po_sent.html',
            context={
                'vendor_name': po.vendor.company_name,
                'po_number': po.po_number,
                'total_amount': po.total_amount,
                'expected_delivery_date': po.expected_delivery_date.strftime('%d %b %Y'),
                'delivery_address': po.delivery_address,
            },
            recipient_list=[po.vendor.user.email]
        )

    except Exception as exc:
        logger.error(f"notify_vendor_po_sent failed: {exc}")
        raise self.retry(exc=exc)


# ─────────────────────────────────────────
# INVOICE NOTIFICATIONS
# ─────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_finance_invoice_submitted(self, invoice_id):
    """Notify finance team when vendor submits invoice"""
    try:
        from procurement.models import Invoice
        from django.contrib.auth import get_user_model
        User = get_user_model()

        invoice = Invoice.objects.select_related(
            'vendor', 'purchase_order'
        ).get(id=invoice_id)

        finance_users = User.objects.filter(
            role='FINANCE',
            email__isnull=False
        ).exclude(email='')

        for finance_user in finance_users:
            send_email(
                subject=f"[Invoice Received] {invoice.invoice_number} from {invoice.vendor.company_name}",
                template_name='invoice_submitted.html',
                context={
                    'invoice_number': invoice.invoice_number,
                    'vendor_name': invoice.vendor.company_name,
                    'po_number': invoice.purchase_order.po_number,
                    'amount': invoice.amount,
                    'due_date': invoice.due_date.strftime('%d %b %Y'),
                },
                recipient_list=[finance_user.email]
            )

    except Exception as exc:
        logger.error(f"notify_finance_invoice_submitted failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_vendor_invoice_paid(self, invoice_id):
    """Notify vendor when invoice is paid"""
    try:
        from procurement.models import Invoice
        invoice = Invoice.objects.select_related(
            'vendor__user', 'payment'
        ).get(id=invoice_id)

        if not invoice.vendor.user.email:
            return

        payment = invoice.payment

        send_email(
            subject=f"[Payment Processed] Invoice {invoice.invoice_number} has been paid",
            template_name='invoice_paid.html',
            context={
                'vendor_name': invoice.vendor.company_name,
                'invoice_number': invoice.invoice_number,
                'amount_paid': payment.amount_paid,
                'payment_method': payment.get_payment_method_display(),
                'payment_reference': payment.payment_reference or 'N/A',
                'payment_date': payment.payment_date.strftime('%d %b %Y'),
            },
            recipient_list=[invoice.vendor.user.email]
        )

    except Exception as exc:
        logger.error(f"notify_vendor_invoice_paid failed: {exc}")
        raise self.retry(exc=exc)
