from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import PurchaseRequest
from .serializers import PurchaseRequestSerializer, PurchaseRequestListSerializer
from .filters import PurchaseRequestFilter
from .pagination import StandardResultsPagination


class PurchaseRequestViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequest.objects.select_related('requester', 'department').prefetch_related('items')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PurchaseRequestFilter
    search_fields = ['title', 'description', 'requester__username']
    ordering_fields = ['created_at', 'estimated_budget', 'status']
    ordering = ['-created_at']
    pagination_class = StandardResultsPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseRequestListSerializer
        return PurchaseRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'EMPLOYEE':
            return qs.filter(requester=user)
        elif user.role == 'MANAGER':
            return qs.filter(department=user.department)
        elif user.role in ['PROCUREMENT', 'FINANCE', 'ADMIN']:
            return qs
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user, department=self.request.user.department)