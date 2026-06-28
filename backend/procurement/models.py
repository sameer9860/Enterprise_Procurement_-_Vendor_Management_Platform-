from django.db import models
from django.conf import settings
from django.utils import timezone

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
#vendor models
class Vendor(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        ACTIVE = 'ACTIVE', 'Active'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        BLACKLISTED = 'BLACKLISTED', 'Blacklisted'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor_profile'
    )
    company_name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    website = models.URLField(blank=True)
    tax_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    categories = models.ManyToManyField('VendorCategory', related_name='vendors', blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='verified_vendors'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company_name} ({self.status})"


class VendorCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class VendorDocument(models.Model):
    class DocumentType(models.TextChoices):
        REGISTRATION = 'REGISTRATION', 'Company Registration'
        TAX = 'TAX', 'Tax Certificate'
        LICENSE = 'LICENSE', 'Business License'
        OTHER = 'OTHER', 'Other'

    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    file_name = models.CharField(max_length=255)
    file_url = models.URLField()  # S3 URL later, local path for now
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vendor.company_name} - {self.document_type}"

class RFQ(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open for Bids'
        CLOSED = 'CLOSED', 'Closed'
        AWARDED = 'AWARDED', 'Awarded'
        CANCELLED = 'CANCELLED', 'Cancelled'

    purchase_request = models.OneToOneField(
        PurchaseRequest,
        on_delete=models.CASCADE,
        related_name='rfq'
    )
    rfq_number = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    invited_vendors = models.ManyToManyField(
        Vendor,
        related_name='invited_rfqs',
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_rfqs'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rfq_number} - {self.title}"

    @classmethod
    def generate_rfq_number(cls):
    
        year = timezone.now().year
        count = cls.objects.filter(created_at__year=year).count() + 1
        return f"RFQ-{year}-{str(count).zfill(5)}"


class RFQItem(models.Model):
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    specifications = models.TextField(blank=True)
    estimated_unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.rfq.rfq_number} - {self.item_name}"        