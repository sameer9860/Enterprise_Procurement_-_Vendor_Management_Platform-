from rest_framework import serializers


class DateRangeSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    year = serializers.IntegerField(required=False)

    def validate(self, data):
        start = data.get('start_date')
        end = data.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError(
                "start_date must be before end_date."
            )
        return data


class SpendSummarySerializer(serializers.Serializer):
    total_spend = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_transactions = serializers.IntegerField()
    average_transaction = serializers.DecimalField(max_digits=14, decimal_places=2)
    largest_payment = serializers.DecimalField(max_digits=14, decimal_places=2)
    smallest_payment = serializers.DecimalField(max_digits=14, decimal_places=2)


class DepartmentSpendSerializer(serializers.Serializer):
    department_name = serializers.CharField()
    total_spend = serializers.DecimalField(max_digits=14, decimal_places=2)
    transaction_count = serializers.IntegerField()
    average_spend = serializers.DecimalField(max_digits=14, decimal_places=2)


class MonthlySpendSerializer(serializers.Serializer):
    month = serializers.DateTimeField()
    total_spend = serializers.DecimalField(max_digits=14, decimal_places=2)
    transaction_count = serializers.IntegerField()


class VendorPerformanceSerializer(serializers.Serializer):
    vendor_id = serializers.IntegerField()
    company_name = serializers.CharField()
    city = serializers.CharField()
    country = serializers.CharField()
    rating = serializers.FloatField()
    total_bids = serializers.IntegerField()
    awarded_bids = serializers.IntegerField()
    win_rate_percent = serializers.FloatField()
    total_purchase_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    delivery_rate_percent = serializers.FloatField()
    total_invoiced_amount = serializers.FloatField()