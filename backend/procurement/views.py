from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import PurchaseRequest, Approval
from .serializers import PurchaseRequestSerializer, PurchaseRequestListSerializer, ApprovalSerializer, ApprovalActionSerializer
from .filters import PurchaseRequestFilter
from .pagination import StandardResultsPagination
from accounts.mixins import RoleRequiredMixin
from accounts.permissions import IsManagerOrAdmin
from audit.utils import log_action

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
        instance = serializer.save(requester=self.request.user, department=self.request.user.department)
        log_action(self.request.user, 'CREATE', instance, 
                    details={"title": instance.title, "budget": str(instance.estimated_budget)}, 
                    request=self.request)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, 'UPDATE', instance, 
                    details={"status": instance.status}, 
                    request=self.request)

    def perform_destroy(self, instance):
        log_action(self.request.user, 'DELETE', instance, request=self.request)
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def approve_action(self, request, pk=None):
        purchase_request = self.get_object()

        if purchase_request.status != PurchaseRequest.Status.PENDING_APPROVAL:
            return Response(
                {"error": f"Cannot act on request with status '{purchase_request.status}'"},
                status=400
            )

        # Manager can only approve requests from their own department
        if request.user.role == 'MANAGER' and purchase_request.department != request.user.department:
            return Response({"error": "You can only approve requests from your department."}, status=403)

        serializer = ApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_value = serializer.validated_data['action']
        comments = serializer.validated_data.get('comments', '')

        # Create approval record
        Approval.objects.create(
            request=purchase_request,
            approver=request.user,
            action=action_value,
            comments=comments
        )

        # Update request status based on action
        status_map = {
            'APPROVED': PurchaseRequest.Status.APPROVED,
            'REJECTED': PurchaseRequest.Status.REJECTED,
            'CHANGES_REQUESTED': PurchaseRequest.Status.CHANGES_REQUESTED,
        }
        purchase_request.status = status_map[action_value]
        purchase_request.save()

        log_action(request.user, action_value, purchase_request,
                    details={"comments": comments}, request=request)

        return Response({
            "message": f"Request {action_value.lower()} successfully.",
            "status": purchase_request.status
        })

    @action(detail=True, methods=['post'])
    def resubmit(self, request, pk=None):
        purchase_request = self.get_object()

        if purchase_request.requester != request.user:
            return Response({"error": "Only the requester can resubmit."}, status=403)

        if purchase_request.status != PurchaseRequest.Status.CHANGES_REQUESTED:
            return Response({"error": "Request is not in 'Changes Requested' status."}, status=400)

        # Update items if provided
        serializer = PurchaseRequestSerializer(purchase_request, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        purchase_request.status = PurchaseRequest.Status.PENDING_APPROVAL
        purchase_request.save()

        log_action(request.user, 'RESUBMIT', purchase_request,
                   details={"new_status": purchase_request.status}, request=request)

        return Response({"message": "Request resubmitted for approval.", "status": purchase_request.status})

    @action(detail=True, methods=['get'])
    def approval_history(self, request, pk=None):
        purchase_request = self.get_object()
        approvals = purchase_request.approvals.all()
        serializer = ApprovalSerializer(approvals, many=True)
        return Response(serializer.data)        