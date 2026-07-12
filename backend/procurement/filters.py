import django_filters
from .models import PurchaseRequest, PurchaseOrder, Invoice


class PurchaseRequestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=PurchaseRequest.Status.choices)
    min_budget = django_filters.NumberFilter(field_name='estimated_budget', lookup_expr='gte')
    max_budget = django_filters.NumberFilter(field_name='estimated_budget', lookup_expr='lte')
    department = django_filters.NumberFilter(field_name='department__id')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = PurchaseRequest
        fields = ['status', 'department', 'min_budget', 'max_budget', 'created_after', 'created_before']


class PurchaseOrderFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=PurchaseOrder.Status.choices)
    vendor = django_filters.NumberFilter(field_name='vendor__id')
    min_amount = django_filters.NumberFilter(field_name='total_amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='total_amount', lookup_expr='lte')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    expected_before = django_filters.DateFilter(field_name='expected_delivery_date', lookup_expr='lte')

    class Meta:
        model = PurchaseOrder
        fields = ['status', 'vendor']


class InvoiceFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Invoice.Status.choices)
    vendor = django_filters.NumberFilter(field_name='vendor__id')
    min_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    due_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    submitted_after = django_filters.DateFilter(field_name='submitted_at', lookup_expr='gte')
    overdue = django_filters.BooleanFilter(method='filter_overdue')

    class Meta:
        model = Invoice
        fields = ['status', 'vendor']

    def filter_overdue(self, queryset, name, value):
        from django.utils import timezone
        today = timezone.now().date()
        if value:
            return queryset.filter(
                due_date__lt=today,
                status__in=['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
            )
        return queryset