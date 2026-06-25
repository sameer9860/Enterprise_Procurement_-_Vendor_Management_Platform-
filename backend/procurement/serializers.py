from rest_framework import serializers
from django.db import transaction
from .models import PurchaseRequest, RequestItem, Approval


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