from rest_framework import serializers
from django.db import transaction
from .models import PurchaseRequest,PurchaseOrder,POItem, RequestItem, Approval, VendorCategory, Vendor, VendorDocument, RFQ, RFQItem,Bid,BidItem,Invoice,InvoiceItem,Payment


class RequestItemSerializer(serializers.ModelSerializer):
    estimated_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = RequestItem
        fields = ['id', 'item_name', 'quantity', 'estimated_unit_price', 'specifications', 'estimated_total']


class PurchaseRequestSerializer(serializers.ModelSerializer):
    items = RequestItemSerializer(many=True, allow_empty=False)
    requester_name = serializers.CharField(source='requester.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = PurchaseRequest
        fields = [
            'id', 'requester', 'requester_name', 'department', 'department_name',
            'title', 'description', 'estimated_budget', 'status',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['requester', 'department', 'status', 'created_at', 'updated_at']

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("At least one item is required.")
        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request_obj = PurchaseRequest.objects.create(**validated_data)
        for item_data in items_data:
            RequestItem.objects.create(request=request_obj, **item_data)
        return request_obj

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                RequestItem.objects.create(request=instance, **item_data)

        return instance


class PurchaseRequestListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    requester_name = serializers.CharField(source='requester.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    item_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = PurchaseRequest
        fields = ['id', 'title', 'requester_name', 'department_name', 'estimated_budget', 'status', 'item_count', 'created_at']

class ApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.username', read_only=True)

    class Meta:
        model = Approval
        fields = ['id', 'request', 'approver', 'approver_name', 'action', 'comments', 'created_at']
        read_only_fields = ['approver', 'created_at']
        
class ApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'])
    comments = serializers.CharField(required=False, allow_blank=True)

class POItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = POItem
        fields = [
            'id', 'item_name', 'quantity',
            'unit_price', 'total_price', 'specifications'
        ]
        read_only_fields = ['total_price']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = POItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    vendor_address = serializers.CharField(source='vendor.address', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    purchase_request_title = serializers.CharField(source='purchase_request.title', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'purchase_request', 'purchase_request_title',
            'awarded_bid', 'vendor', 'vendor_name', 'vendor_address',
            'status', 'delivery_address', 'expected_delivery_date',
            'special_instructions', 'total_amount', 'pdf_url',
            'created_by', 'created_by_name',
            'sent_at', 'acknowledged_at',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'po_number', 'vendor', 'total_amount', 'pdf_url',
            'created_by', 'sent_at', 'acknowledged_at',
            'created_at', 'updated_at'
        ]


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    purchase_request_title = serializers.CharField(source='purchase_request.title', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'vendor_name', 'purchase_request_title',
            'total_amount', 'status', 'expected_delivery_date', 'created_at'
        ]


class POCreateSerializer(serializers.Serializer):
    """Used to generate PO from awarded bid"""
    bid_id = serializers.IntegerField()
    delivery_address = serializers.CharField()
    expected_delivery_date = serializers.DateField()
    special_instructions = serializers.CharField(required=False, allow_blank=True)


class POStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        'SENT', 'ACKNOWLEDGED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'
    ])
    notes = serializers.CharField(required=False, allow_blank=True)

class VendorCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorCategory
        fields = ['id', 'name', 'description']


class VendorDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorDocument
        fields = ['id', 'document_type', 'file_name', 'file_url', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class VendorSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    categories = VendorCategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=VendorCategory.objects.all(),
        write_only=True,
        source='categories'
    )
    documents = VendorDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'user_email', 'company_name', 'registration_number',
            'address', 'city', 'country', 'website', 'tax_number',
            'status', 'rating', 'categories', 'category_ids',
            'documents', 'verified_at', 'created_at'
        ]
        read_only_fields = ['user', 'status', 'rating', 'verified_at', 'created_at']


class VendorListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    category_names = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = ['id', 'company_name', 'city', 'country', 'status', 'rating', 'category_names']

    def get_category_names(self, obj):
        return list(obj.categories.values_list('name', flat=True))


class VendorVerifySerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['ACTIVE', 'SUSPENDED', 'BLACKLISTED'])
    comments = serializers.CharField(required=False, allow_blank=True)

class RFQItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQItem
        fields = ['id', 'item_name', 'quantity', 'specifications', 'estimated_unit_price']


class RFQSerializer(serializers.ModelSerializer):
    items = RFQItemSerializer(many=True, read_only=True)
    invited_vendor_names = serializers.SerializerMethodField()
    purchase_request_title = serializers.CharField(source='purchase_request.title', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = RFQ
        fields = [
            'id', 'rfq_number', 'title', 'description',
            'purchase_request', 'purchase_request_title',
            'deadline', 'status', 'items',
            'invited_vendors', 'invited_vendor_names',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['rfq_number', 'created_by', 'created_at', 'updated_at']

    def get_invited_vendor_names(self, obj):
        return list(obj.invited_vendors.values_list('company_name', flat=True))


class RFQCreateSerializer(serializers.Serializer):
    """Used to create RFQ from approved PurchaseRequest"""
    deadline = serializers.DateTimeField()
    description = serializers.CharField(required=False, allow_blank=True)
    vendor_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of vendor IDs to invite. Leave empty to invite all active vendors."
    )


class RFQListSerializer(serializers.ModelSerializer):
    purchase_request_title = serializers.CharField(source='purchase_request.title', read_only=True)
    bid_count = serializers.SerializerMethodField()

    class Meta:
        model = RFQ
        fields = ['id', 'rfq_number', 'title', 'status', 'deadline', 'purchase_request_title', 'bid_count', 'created_at']

    def get_bid_count(self, obj):
        return 0


class BidItemSerializer(serializers.ModelSerializer):
    rfq_item_name = serializers.CharField(source='rfq_item.item_name', read_only=True)

    class Meta:
        model = BidItem
        fields = ['id', 'rfq_item', 'rfq_item_name', 'unit_price', 'quantity', 'total_price']
        read_only_fields = ['total_price']


class BidSerializer(serializers.ModelSerializer):
    items = BidItemSerializer(many=True)
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    rfq_number = serializers.CharField(source='rfq.rfq_number', read_only=True)

    class Meta:
        model = Bid
        fields = [
            'id', 'rfq', 'rfq_number', 'vendor', 'vendor_name',
            'total_amount', 'delivery_days', 'validity_days',
            'notes', 'status', 'items', 'submitted_at', 'updated_at'
        ]
        read_only_fields = ['vendor', 'status', 'submitted_at', 'updated_at']

    def validate(self, data):
        rfq = data.get('rfq')
        if rfq and rfq.status != 'OPEN':
            raise serializers.ValidationError("This RFQ is not open for bidding.")
        return data

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        bid = Bid.objects.create(**validated_data)
        for item_data in items_data:
            BidItem.objects.create(bid=bid, **item_data)
        return bid


class BidListSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    rfq_number = serializers.CharField(source='rfq.rfq_number', read_only=True)

    class Meta:
        model = Bid
        fields = ['id', 'rfq_number', 'vendor_name', 'total_amount', 'delivery_days', 'status', 'submitted_at']


class BidComparisonSerializer(serializers.ModelSerializer):
    """Detailed serializer for side-by-side comparison"""
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    vendor_rating = serializers.DecimalField(source='vendor.rating', max_digits=3, decimal_places=2, read_only=True)
    items = BidItemSerializer(many=True, read_only=True)
    savings_vs_budget = serializers.SerializerMethodField()
    rank = serializers.SerializerMethodField()

    class Meta:
        model = Bid
        fields = [
            'id', 'vendor_name', 'vendor_rating', 'total_amount',
            'delivery_days', 'validity_days', 'notes', 'status',
            'items', 'savings_vs_budget', 'rank', 'submitted_at'
        ]

    def get_savings_vs_budget(self, obj):
        budget = obj.rfq.purchase_request.estimated_budget
        saving = budget - obj.total_amount
        return {
            "amount": str(saving),
            "percentage": str(round((saving / budget) * 100, 2)) if budget > 0 else "0"
        }

    def get_rank(self, obj):
        # Rank by lowest total_amount among all bids for same RFQ
        bids = obj.rfq.bids.order_by('total_amount')
        for idx, bid in enumerate(bids, start=1):
            if bid.id == obj.id:
                return idx
        return None


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']


class PaymentSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(
        source='processed_by.username',
        read_only=True
    )

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'amount_paid', 'payment_method',
            'payment_reference', 'payment_date', 'notes',
            'processed_by', 'processed_by_name', 'created_at'
        ]
        read_only_fields = ['processed_by', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    paid_by_name = serializers.CharField(source='paid_by.username', read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'purchase_order', 'po_number',
            'vendor', 'vendor_name', 'status', 'amount',
            'invoice_date', 'due_date', 'file_name', 'file_url',
            'notes', 'rejection_reason',
            'submitted_at', 'reviewed_at', 'reviewed_by', 'reviewed_by_name',
            'approved_at', 'approved_by', 'approved_by_name',
            'paid_at', 'paid_by', 'paid_by_name',
            'items', 'payment', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'invoice_number', 'vendor', 'status',
            'reviewed_at', 'reviewed_by',
            'approved_at', 'approved_by',
            'paid_at', 'paid_by',
            'rejection_reason', 'submitted_at',
            'created_at', 'updated_at'
        ]


class InvoiceListSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'po_number', 'vendor_name',
            'amount', 'status', 'invoice_date', 'due_date', 'submitted_at'
        ]


class InvoiceSubmitSerializer(serializers.Serializer):
    """Used by vendor to submit invoice"""
    purchase_order_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    invoice_date = serializers.DateField()
    due_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)
    items = InvoiceItemSerializer(many=True, required=False)

    def validate(self, data):
        if data['due_date'] <= data['invoice_date']:
            raise serializers.ValidationError(
                "Due date must be after invoice date."
            )
        return data


class InvoiceReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVE', 'REJECT', 'UNDER_REVIEW'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['action'] == 'REJECT' and not data.get('rejection_reason'):
            raise serializers.ValidationError(
                "Rejection reason is required when rejecting an invoice."
            )
        return data


class PaymentCreateSerializer(serializers.Serializer):
    amount_paid = serializers.DecimalField(max_digits=14, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=Payment.Method.choices)
    payment_reference = serializers.CharField(required=False, allow_blank=True)
    payment_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)                    