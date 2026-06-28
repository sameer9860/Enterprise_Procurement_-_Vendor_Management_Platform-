from rest_framework import serializers
from django.db import transaction
from .models import PurchaseRequest, RequestItem, Approval, VendorCategory, Vendor, VendorDocument, RFQ, RFQItem


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
        return obj.bids.count()    