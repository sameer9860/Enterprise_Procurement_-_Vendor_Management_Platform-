import django_filters
from .models import PurchaseRequest

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