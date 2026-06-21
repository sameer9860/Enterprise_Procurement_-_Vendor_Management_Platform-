from django.db import models
from django.conf import settings

class PurchaseRequest(models.Model):
    class Status(models.TextChoices):
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Manager Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CHANGES_REQUESTED = 'CHANGES_REQUESTED', 'Changes Requested'
        RFQ_CREATED = 'RFQ_CREATED', 'RFQ Created'
        VENDOR_SELECTED = 'VENDOR_SELECTED', 'Vendor Selected'
        PO_GENERATED = 'PO_GENERATED', 'PO Generated'
        INVOICE_RECEIVED = 'INVOICE_RECEIVED', 'Invoice Received'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='requests')
    department = models.ForeignKey('accounts.Department', on_delete=models.CASCADE, related_name='requests')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING_APPROVAL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['requester', 'status']),
        ]

    def __str__(self):
        return f"REQ-{self.id} - {self.title}"


class RequestItem(models.Model):
    request = models.ForeignKey(PurchaseRequest, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    estimated_unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    specifications = models.TextField(blank=True)

    @property
    def estimated_total(self):
        return self.quantity * self.estimated_unit_price

    def __str__(self):
        return f"{self.item_name} x{self.quantity}"

class Approval(models.Model):
    class Action(models.TextChoices):
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CHANGES_REQUESTED = 'CHANGES_REQUESTED', 'Changes Requested'

    request = models.ForeignKey(PurchaseRequest, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='approvals_given')
    action = models.CharField(max_length=20, choices=Action.choices)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.request} - {self.action} by {self.approver}"        