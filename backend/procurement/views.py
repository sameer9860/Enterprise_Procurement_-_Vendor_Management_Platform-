from rest_framework import viewsets, permissions, filters, status
from rest_framework import filters as drf_filters
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import PurchaseRequest, Approval
from .serializers import PurchaseRequestSerializer, PurchaseRequestListSerializer, ApprovalSerializer, ApprovalActionSerializer,VendorDocumentSerializer
from .filters import PurchaseRequestFilter, PurchaseOrderFilter, InvoiceFilter
from .pagination import StandardResultsPagination
from accounts.mixins import RoleRequiredMixin
from accounts.permissions import IsManagerOrAdmin
from audit.utils import log_action
from django.http import HttpResponse
from .pdf_utils import generate_po_pdf, save_po_pdf_locally
from .supabase_utils import upload_vendor_document_to_supabase, get_supabase_signed_url
from django.utils import timezone
from django.db.models import Q
from django.db import transaction
from notifications.tasks import (
    notify_manager_new_request,
    notify_requester_approval_action,
    notify_vendors_rfq_created,
    notify_vendor_bid_awarded,
    notify_vendor_po_sent,
    notify_finance_invoice_submitted,
    notify_vendor_invoice_paid,
)

from .models import Vendor, VendorCategory, VendorDocument

from .serializers import (
    VendorSerializer, VendorListSerializer,
    VendorCategorySerializer, VendorVerifySerializer
)
from accounts.permissions import IsVendor, IsProcurement, IsAdmin

from .models import RFQ, RFQItem
from .serializers import RFQSerializer, RFQListSerializer, RFQCreateSerializer

from .models import Bid, BidItem
from .serializers import BidSerializer, BidListSerializer, BidComparisonSerializer
from django.db.models import Min, Max, Avg, Count
from rest_framework import serializers as drf_serializers
from .models import PurchaseOrder, POItem
from .serializers import (
    PurchaseOrderSerializer, PurchaseOrderListSerializer,
    POCreateSerializer, POStatusUpdateSerializer
)

from .models import Invoice, InvoiceItem, Payment
from .serializers import (
    InvoiceSerializer, InvoiceListSerializer,
    InvoiceSubmitSerializer, InvoiceReviewSerializer,
    PaymentSerializer, PaymentCreateSerializer
)
from accounts.permissions import IsFinance



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
        # Fire async notification to department managers
        notify_manager_new_request.delay(instance.id)

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

        # Fire async notification to requester
        notify_requester_approval_action.delay(
            purchase_request.id, action_value, comments
        )

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
    

class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.select_related('user').prefetch_related('categories', 'documents')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return VendorListSerializer
        return VendorSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'VENDOR':
            return qs.filter(user=user)
        elif user.role in ['PROCUREMENT', 'ADMIN', 'MANAGER', 'FINANCE']:
            return qs
        return qs.none()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['verify_vendor']:
            return [IsProcurement()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        if self.request.user.role != 'VENDOR':
            raise ValidationError("Only users with VENDOR role can create vendor profiles.")
        if Vendor.objects.filter(user=self.request.user).exists():
            raise ValidationError("Vendor profile already exists for this user.")
        instance = serializer.save(user=self.request.user)
        log_action(self.request.user, 'CREATE_VENDOR', instance, request=self.request)

    @action(detail=True, methods=['post'], permission_classes=[IsProcurement])
    def verify_vendor(self, request, pk=None):
        vendor = self.get_object()
        serializer = VendorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_value = serializer.validated_data['action']
        vendor.status = action_value

        if action_value == 'ACTIVE':
            vendor.verified_at = timezone.now()
            vendor.verified_by = request.user

        vendor.save()

        log_action(request.user, f'VENDOR_{action_value}', vendor,
                    details={"comments": serializer.validated_data.get('comments', '')},
                    request=request)

        return Response({
            "message": f"Vendor {action_value.lower()} successfully.",
            "vendor_id": vendor.id,
            "status": vendor.status
        })

    @action(detail=False, methods=['get'])
    def active_vendors(self, request):
        """Quick endpoint to get all active vendors for RFQ invitations"""
        vendors = Vendor.objects.filter(status='ACTIVE').select_related('user').prefetch_related('categories')
        serializer = VendorListSerializer(vendors, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_document(self, request, pk=None):
        vendor = self.get_object()

        if request.user.role == 'VENDOR' and vendor.user != request.user:
            return Response({"error": "Access denied."}, status=403)

        if request.user.role not in ['VENDOR', 'PROCUREMENT', 'ADMIN', 'MANAGER', 'FINANCE']:
            return Response({"error": "Access denied."}, status=403)

        document_type = request.data.get('document_type')
        file_obj = request.FILES.get('file')

        if not document_type or not file_obj:
            return Response({"error": "document_type and file are required."}, status=400)

        storage_path = upload_vendor_document_to_supabase(file_obj, vendor.id, document_type)
        if not storage_path:
            return Response({"error": "Unable to upload document. Check storage configuration."}, status=400)

        document = VendorDocument.objects.create(
            vendor=vendor,
            document_type=document_type,
            file_name=file_obj.name,
            file_url=storage_path,
        )

        return Response(
            VendorDocumentSerializer(document).data,
            status=201,
        )


class VendorCategoryViewSet(viewsets.ModelViewSet):
    queryset = VendorCategory.objects.all()
    serializer_class = VendorCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.select_related(
        'purchase_request', 'created_by'
    ).prefetch_related('items', 'invited_vendors')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return RFQListSerializer
        return RFQSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'VENDOR':
            # Vendor sees only RFQs they are invited to + open RFQs
            try:
                vendor = user.vendor_profile
                return qs.filter(
                    status='OPEN'
                ).filter(
                    Q(invited_vendors=vendor) | Q(invited_vendors__isnull=True)
                ).distinct()
            except Vendor.DoesNotExist:
                return qs.none()
        elif user.role in ['PROCUREMENT', 'ADMIN']:
            return qs
        elif user.role in ['MANAGER', 'FINANCE']:
            return qs.filter(status__in=['OPEN', 'CLOSED', 'AWARDED'])
        return qs.none()

    def get_permissions(self):
        if self.action in ['create', 'create_from_request', 'close_rfq', 'update', 'partial_update']:
            return [IsProcurement()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[IsProcurement])
    def create_from_request(self, request):
        """Create RFQ from an approved PurchaseRequest"""
        request_id = request.data.get('request_id')

        if not request_id:
            return Response({"error": "request_id is required."}, status=400)

        try:
            purchase_request = PurchaseRequest.objects.get(id=request_id)
        except PurchaseRequest.DoesNotExist:
            return Response({"error": "Purchase request not found."}, status=404)

        if purchase_request.status != PurchaseRequest.Status.APPROVED:
            return Response(
                {"error": f"Request must be APPROVED before creating RFQ. Current status: {purchase_request.status}"},
                status=400
            )

        if hasattr(purchase_request, 'rfq'):
            return Response({"error": "RFQ already exists for this request."}, status=400)

        serializer = RFQCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create RFQ
        rfq = RFQ.objects.create(
            purchase_request=purchase_request,
            rfq_number=RFQ.generate_rfq_number(),
            title=purchase_request.title,
            description=serializer.validated_data.get('description', purchase_request.description),
            deadline=serializer.validated_data['deadline'],
            created_by=request.user
        )

        # Copy items from PurchaseRequest to RFQ
        for item in purchase_request.items.all():
            RFQItem.objects.create(
                rfq=rfq,
                item_name=item.item_name,
                quantity=item.quantity,
                specifications=item.specifications,
                estimated_unit_price=item.estimated_unit_price
            )

        # Invite vendors
        vendor_ids = serializer.validated_data.get('vendor_ids', [])
        if vendor_ids:
            vendors = Vendor.objects.filter(id__in=vendor_ids, status='ACTIVE')
        else:
            vendors = Vendor.objects.filter(status='ACTIVE')

        rfq.invited_vendors.set(vendors)

        # Update purchase request status
        purchase_request.status = PurchaseRequest.Status.RFQ_CREATED
        purchase_request.save()

        log_action(request.user, 'CREATE_RFQ', rfq,
                    details={"rfq_number": rfq.rfq_number, "vendors_invited": vendors.count()},
                    request=request)

        # Fire async notification to invited vendors
        notify_vendors_rfq_created.delay(rfq.id)

        return Response(RFQSerializer(rfq).data, status=201)

    @action(detail=True, methods=['post'], permission_classes=[IsProcurement])
    def close_rfq(self, request, pk=None):
        rfq = self.get_object()
        if rfq.status != 'OPEN':
            return Response({"error": "Only OPEN RFQs can be closed."}, status=400)
        rfq.status = 'CLOSED'
        rfq.save()
        log_action(request.user, 'CLOSE_RFQ', rfq, request=request)
        return Response({"message": "RFQ closed. No more bids will be accepted.", "rfq_number": rfq.rfq_number})

    @action(detail=True, methods=['get'])
    def awarded_bid(self, request, pk=None):
        """Return the awarded bid for this RFQ, if any."""
        rfq = self.get_object()
        try:
            bid = rfq.bids.get(status='AWARDED')
            return Response(BidComparisonSerializer(bid).data)
        except Bid.DoesNotExist:
            return Response({"message": "No bid has been awarded yet for this RFQ."})


class BidViewSet(viewsets.ModelViewSet):
    queryset = Bid.objects.select_related('rfq', 'vendor').prefetch_related('items')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return BidListSerializer
        return BidSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'VENDOR':
            try:
                return qs.filter(vendor=user.vendor_profile)
            except Vendor.DoesNotExist:
                return qs.none()
        elif user.role in ['PROCUREMENT', 'ADMIN']:
            return qs
        elif user.role == 'MANAGER':
            return qs.filter(rfq__purchase_request__department=user.department)
        return qs.none()

    def get_permissions(self):
        if self.action == 'create':
            return [IsVendor()]
        if self.action in ['shortlist', 'reject_bid', 'award_bid', 'compare']:
            return [IsProcurement()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        try:
            vendor = self.request.user.vendor_profile
        except Vendor.DoesNotExist:
            raise drf_serializers.ValidationError("You do not have a vendor profile.")

        if vendor.status != 'ACTIVE':
            raise drf_serializers.ValidationError("Your vendor account is not active.")

        # Check vendor has not already bid on this RFQ
        rfq = serializer.validated_data['rfq']
        if Bid.objects.filter(rfq=rfq, vendor=vendor).exists():
            raise drf_serializers.ValidationError("You have already submitted a bid for this RFQ.")

        instance = serializer.save(vendor=vendor)
        log_action(self.request.user, 'SUBMIT_BID', instance,
                   details={"rfq": rfq.rfq_number, "amount": str(instance.total_amount)},
                   request=self.request)

    @action(detail=False, methods=['get'], permission_classes=[IsProcurement])
    def compare(self, request):
        """Bid comparison dashboard for an RFQ."""
        rfq_id = request.query_params.get('rfq_id')
        if not rfq_id:
            return Response({"error": "rfq_id query param is required."}, status=400)

        try:
            rfq = RFQ.objects.get(id=rfq_id)
        except RFQ.DoesNotExist:
            return Response({"error": "RFQ not found."}, status=404)

        bids = (
            Bid.objects
            .filter(rfq=rfq)
            .select_related('vendor')
            .prefetch_related('items')
            .order_by('total_amount')
        )

        if not bids.exists():
            return Response({"message": "No bids submitted yet.", "rfq": rfq.rfq_number, "bids": []})

        stats = bids.aggregate(
            lowest_bid=Min('total_amount'),
            highest_bid=Max('total_amount'),
            average_bid=Avg('total_amount'),
            total_bids=Count('id')
        )

        serialized_bids = BidComparisonSerializer(bids, many=True).data

        return Response({
            "rfq_number": rfq.rfq_number,
            "rfq_title": rfq.title,
            "estimated_budget": str(rfq.purchase_request.estimated_budget),
            "deadline": rfq.deadline,
            "status": rfq.status,
            "statistics": {
                "total_bids": stats['total_bids'],
                "lowest_bid": str(stats['lowest_bid']),
                "highest_bid": str(stats['highest_bid']),
                "average_bid": str(round(stats['average_bid'], 2)),
            },
            "bids": serialized_bids
        })

    @action(detail=True, methods=['post'], permission_classes=[IsProcurement])
    def shortlist(self, request, pk=None):
        bid = self.get_object()
        bid.status = 'SHORTLISTED'
        bid.save()
        log_action(request.user, 'SHORTLIST_BID', bid, request=request)
        return Response({"message": f"Bid from {bid.vendor.company_name} shortlisted."})

    @action(detail=True, methods=['post'], permission_classes=[IsProcurement])
    def reject_bid(self, request, pk=None):
        bid = self.get_object()
        if bid.status == 'AWARDED':
            return Response({"error": "Cannot reject an awarded bid."}, status=400)
        bid.status = 'REJECTED'
        bid.save()
        log_action(request.user, 'REJECT_BID', bid, request=request)
        return Response({"message": f"Bid from {bid.vendor.company_name} rejected."})

    @action(detail=True, methods=['post'], permission_classes=[IsProcurement])
    def award_bid(self, request, pk=None):
        """Award a bid — atomically rejects all others and advances the procurement flow."""
        bid = self.get_object()

        if bid.rfq.status != 'CLOSED':
            return Response(
                {"error": "RFQ must be CLOSED before awarding a bid. Close the RFQ first."},
                status=400
            )

        if bid.status not in ['SUBMITTED', 'SHORTLISTED', 'UNDER_REVIEW']:
            return Response(
                {"error": f"Cannot award a bid with status '{bid.status}'."},
                status=400
            )

        if Bid.objects.filter(rfq=bid.rfq, status='AWARDED').exists():
            return Response(
                {"error": "A bid has already been awarded for this RFQ."},
                status=400
            )

        with transaction.atomic():
            # Award this bid
            bid.status = 'AWARDED'
            bid.save()

            # Reject all remaining bids for this RFQ
            Bid.objects.filter(rfq=bid.rfq).exclude(id=bid.id).update(status='REJECTED')

            # Advance RFQ status
            bid.rfq.status = 'AWARDED'
            bid.rfq.save()

            # Advance PurchaseRequest status
            purchase_request = bid.rfq.purchase_request
            purchase_request.status = PurchaseRequest.Status.VENDOR_SELECTED
            purchase_request.save()

        log_action(
            request.user, 'AWARD_BID', bid,
            details={
                "vendor": bid.vendor.company_name,
                "amount": str(bid.total_amount),
                "rfq": bid.rfq.rfq_number,
            },
            request=request,
        )

        # Fire async notification to awarded vendor
        notify_vendor_bid_awarded.delay(bid.id)

        return Response({
            "message": f"Bid awarded to {bid.vendor.company_name}.",
            "bid_id": bid.id,
            "vendor": bid.vendor.company_name,
            "awarded_amount": str(bid.total_amount),
            "purchase_request_status": purchase_request.status,
        })


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related(
        'purchase_request', 'vendor', 'awarded_bid', 'created_by'
    ).prefetch_related('items')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_class = PurchaseOrderFilter
    search_fields = ['po_number', 'vendor__company_name', 'purchase_request__title']
    ordering_fields = ['created_at', 'total_amount', 'expected_delivery_date']
    ordering = ['-created_at']
    pagination_class = StandardResultsPagination

    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseOrderListSerializer
        return PurchaseOrderSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'VENDOR':
            try:
                return qs.filter(vendor=user.vendor_profile)
            except Vendor.DoesNotExist:
                return qs.none()
        elif user.role == 'MANAGER':
            return qs.filter(purchase_request__department=user.department)
        elif user.role in ['PROCUREMENT', 'FINANCE', 'ADMIN']:
            return qs
        return qs.none()

    def get_permissions(self):
        if self.action in ['generate_po', 'update_status', 'send_to_vendor']:
            return [IsProcurement()]
        if self.action == 'acknowledge':
            return [IsVendor()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[IsProcurement])
    def generate_po(self, request):
        serializer = POCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bid_id = serializer.validated_data['bid_id']

        try:
            bid = Bid.objects.select_related(
                'rfq__purchase_request', 'vendor'
            ).get(id=bid_id)
        except Bid.DoesNotExist:
            return Response({"error": "Bid not found."}, status=404)

        if bid.status != 'AWARDED':
            return Response({"error": "Only awarded bids can be converted to a PO."}, status=400)

        if hasattr(bid, 'purchase_order'):
            return Response({"error": "A PO has already been generated for this bid."}, status=400)

        with transaction.atomic():
            po = PurchaseOrder.objects.create(
                po_number=PurchaseOrder.generate_po_number(),
                purchase_request=bid.rfq.purchase_request,
                awarded_bid=bid,
                vendor=bid.vendor,
                delivery_address=serializer.validated_data['delivery_address'],
                expected_delivery_date=serializer.validated_data['expected_delivery_date'],
                special_instructions=serializer.validated_data.get('special_instructions', ''),
                total_amount=bid.total_amount,
                created_by=request.user
            )

            # Copy items from awarded bid
            for bid_item in bid.items.all():
                POItem.objects.create(
                    purchase_order=po,
                    item_name=bid_item.rfq_item.item_name,
                    quantity=bid_item.quantity,
                    unit_price=bid_item.unit_price,
                    specifications=bid_item.rfq_item.specifications
                )

            # Update PurchaseRequest status
            bid.rfq.purchase_request.status = PurchaseRequest.Status.PO_GENERATED
            bid.rfq.purchase_request.save()

        log_action(request.user, 'GENERATE_PO', po,
                    details={"po_number": po.po_number, "vendor": po.vendor.company_name},
                    request=request)

        return Response(PurchaseOrderSerializer(po).data, status=201)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        po = self.get_object()

        allowed_roles = ['PROCUREMENT', 'ADMIN', 'FINANCE', 'MANAGER']
        if request.user.role == 'VENDOR' and po.vendor != getattr(request.user, 'vendor_profile', None):
            return Response({"error": "Access denied."}, status=403)

        if request.user.role not in allowed_roles and request.user.role != 'VENDOR':
            return Response({"error": "Access denied."}, status=403)

        pdf_bytes = generate_po_pdf(
            po,
            company_name="Procurement Platform Inc.",
            company_address="123 Business Park, Kathmandu, Nepal"
        )

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{po.po_number}.pdf"'
        return response

    @action(detail=True, methods=['post'], permission_classes=[IsProcurement])
    def generate_pdf_and_save(self, request, pk=None):
        po = self.get_object()
        file_path = save_po_pdf_locally(po)

        po.pdf_url = file_path
        po.save()

        log_action(request.user, 'GENERATE_PDF', po,
                    details={"file_path": file_path},
                    request=request)

        return Response({
            "message": "PDF generated and stored successfully.",
            "po_number": po.po_number,
            "pdf_ref": file_path
        })

    @action(detail=True, methods=['get'], permission_classes=[IsProcurement])
    def get_pdf_url(self, request, pk=None):
        po = self.get_object()

        if not po.pdf_url:
            return Response(
                {"error": "No PDF has been generated for this PO yet. Call generate_pdf_and_save first."},
                status=400
            )

        from django.conf import settings
        if getattr(settings, 'USE_SUPABASE', False):
            signed_url = get_supabase_signed_url(po.pdf_url, expiry_seconds=3600)
            if not signed_url:
                return Response(
                    {"error": "Failed to generate a signed URL. Check your Supabase configuration."},
                    status=500
                )
            return Response({
                "po_number": po.po_number,
                "download_url": signed_url,
                "expires_in": "1 hour"
            })
        else:
            # Local fallback — return the local file path
            return Response({
                "po_number": po.po_number,
                "download_url": request.build_absolute_uri(f"/media/{po.pdf_url.lstrip('media/')}"),
                "expires_in": "N/A (local storage)"
            })

    @action(detail=True, methods=['post'], permission_classes=[IsProcurement])
    def send_to_vendor(self, request, pk=None):
        po = self.get_object()

        if po.status != 'DRAFT':
            return Response({"error": "Only DRAFT POs can be sent."}, status=400)

        po.status = 'SENT'
        po.sent_at = timezone.now()
        po.save()

        log_action(request.user, 'SEND_PO', po,
                    details={"po_number": po.po_number},
                    request=request)

        # Fire async notification to vendor
        notify_vendor_po_sent.delay(po.id)

        return Response({
            "message": f"PO {po.po_number} sent to {po.vendor.company_name}.",
            "sent_at": po.sent_at
        })

    @action(detail=True, methods=['post'], permission_classes=[IsVendor])
    def acknowledge(self, request, pk=None):
        po = self.get_object()

        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({"error": "Vendor profile not found."}, status=403)

        if po.vendor != vendor:
            return Response({"error": "This PO does not belong to your vendor account."}, status=403)

        if po.status != 'SENT':
            return Response({"error": "Only SENT POs can be acknowledged."}, status=400)

        po.status = 'ACKNOWLEDGED'
        po.acknowledged_at = timezone.now()
        po.save()

        log_action(request.user, 'ACKNOWLEDGE_PO', po,
                    details={"po_number": po.po_number},
                    request=request)

        return Response({
            "message": f"PO {po.po_number} acknowledged successfully.",
            "acknowledged_at": po.acknowledged_at
        })

    @action(detail=True, methods=['post'], permission_classes=[IsProcurement])
    def update_status(self, request, pk=None):
        po = self.get_object()
        serializer = POStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']

        # Status transition validation
        valid_transitions = {
            'DRAFT': ['SENT', 'CANCELLED'],
            'SENT': ['ACKNOWLEDGED', 'CANCELLED'],
            'ACKNOWLEDGED': ['IN_PROGRESS', 'CANCELLED'],
            'IN_PROGRESS': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': [],
            'CANCELLED': [],
        }

        if new_status not in valid_transitions.get(po.status, []):
            return Response(
                {"error": f"Cannot transition from '{po.status}' to '{new_status}'. "
                          f"Allowed: {valid_transitions.get(po.status, [])}"},
                status=400
            )

        po.status = new_status
        po.save()

        log_action(request.user, f'PO_STATUS_{new_status}', po,
                    details={"notes": serializer.validated_data.get('notes', '')},
                    request=request)

        return Response({
            "message": f"PO status updated to {new_status}.",
            "po_number": po.po_number,
            "status": po.status
        })

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Full status timeline for a PO from creation to delivery."""
        po = self.get_object()

        from audit.models import AuditLog
        logs = AuditLog.objects.filter(
            model_name='PurchaseOrder',
            object_id=po.id
        ).select_related('user').order_by('timestamp')

        timeline = []
        for log in logs:
            timeline.append({
                "action": log.action,
                "performed_by": log.user.username if log.user else "System",
                "role": log.user.role if log.user else "N/A",
                "details": log.details,
                "timestamp": log.timestamp,
            })

        return Response({
            "po_number": po.po_number,
            "current_status": po.status,
            "vendor": po.vendor.company_name,
            "total_amount": str(po.total_amount),
            "expected_delivery": po.expected_delivery_date,
            "timeline": timeline
        })

    @action(detail=False, methods=['get'], permission_classes=[IsProcurement])
    def summary(self, request):
        """Aggregated summary statistics for all Purchase Orders."""
        from django.db.models import Sum, Count, Q

        stats = PurchaseOrder.objects.aggregate(
            total_pos=Count('id'),
            total_value=Sum('total_amount'),
            draft_count=Count('id', filter=Q(status='DRAFT')),
            sent_count=Count('id', filter=Q(status='SENT')),
            acknowledged_count=Count('id', filter=Q(status='ACKNOWLEDGED')),
            in_progress_count=Count('id', filter=Q(status='IN_PROGRESS')),
            delivered_count=Count('id', filter=Q(status='DELIVERED')),
            cancelled_count=Count('id', filter=Q(status='CANCELLED')),
        )

        return Response({
            "total_purchase_orders": stats['total_pos'],
            "total_value": str(stats['total_value'] or 0),
            "by_status": {
                "draft": stats['draft_count'],
                "sent": stats['sent_count'],
                "acknowledged": stats['acknowledged_count'],
                "in_progress": stats['in_progress_count'],
                "delivered": stats['delivered_count'],
                "cancelled": stats['cancelled_count'],
            }
        })


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        'purchase_order', 'vendor',
        'reviewed_by', 'approved_by', 'paid_by'
    ).prefetch_related('items', 'payment')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_class = InvoiceFilter
    search_fields = ['invoice_number', 'vendor__company_name', 'purchase_order__po_number']
    ordering_fields = ['submitted_at', 'amount', 'due_date', 'status']
    ordering = ['-submitted_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'VENDOR':
            try:
                return qs.filter(vendor=user.vendor_profile)
            except Vendor.DoesNotExist:
                return qs.none()
        elif user.role == 'FINANCE':
            return qs
        elif user.role in ['PROCUREMENT', 'ADMIN']:
            return qs
        elif user.role == 'MANAGER':
            return qs.filter(
                purchase_order__purchase_request__department=user.department
            )
        return qs.none()

    def get_permissions(self):
        if self.action == 'submit_invoice':
            return [IsVendor()]
        if self.action in ['review_invoice', 'mark_under_review', 'record_payment', 'summary']:
            return [IsFinance()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[IsVendor])
    def submit_invoice(self, request):
        """Vendor submits an invoice for a PO"""
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({"error": "Vendor profile not found."}, status=403)

        serializer = InvoiceSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        po_id = serializer.validated_data['purchase_order_id']

        try:
            po = PurchaseOrder.objects.get(id=po_id, vendor=vendor)
        except PurchaseOrder.DoesNotExist:
            return Response(
                {"error": "Purchase order not found or does not belong to you."},
                status=404
            )

        # PO must be at least ACKNOWLEDGED
        if po.status not in ['ACKNOWLEDGED', 'IN_PROGRESS', 'DELIVERED']:
            return Response(
                {"error": f"Cannot submit invoice for PO with status '{po.status}'."},
                status=400
            )

        # Check no pending invoice already exists
        existing = Invoice.objects.filter(
            purchase_order=po,
            status__in=['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
        ).exists()
        if existing:
            return Response(
                {"error": "An active invoice already exists for this PO."},
                status=400
            )

        with transaction.atomic():
            invoice = Invoice.objects.create(
                invoice_number=Invoice.generate_invoice_number(),
                purchase_order=po,
                vendor=vendor,
                amount=serializer.validated_data['amount'],
                invoice_date=serializer.validated_data['invoice_date'],
                due_date=serializer.validated_data['due_date'],
                notes=serializer.validated_data.get('notes', '')
            )

            # Create invoice items if provided
            items_data = serializer.validated_data.get('items', [])
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=invoice, **item_data)

            # Update PurchaseRequest status
            po.purchase_request.status = PurchaseRequest.Status.INVOICE_RECEIVED
            po.purchase_request.save()

        log_action(request.user, 'SUBMIT_INVOICE', invoice,
                    details={
                        "invoice_number": invoice.invoice_number,
                        "amount": str(invoice.amount),
                        "po": po.po_number
                    },
                    request=request)

        # Fire async notification to finance team
        notify_finance_invoice_submitted.delay(invoice.id)

        return Response(InvoiceSerializer(invoice).data, status=201)

    @action(detail=True, methods=['post'], permission_classes=[IsVendor])
    def upload_invoice_file(self, request, pk=None):
        """Vendor uploads the actual invoice PDF file"""
        invoice = self.get_object()

        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({"error": "Vendor profile not found."}, status=403)

        if invoice.vendor != vendor:
            return Response(
                {"error": "This invoice does not belong to you."},
                status=403
            )

        if invoice.status != 'SUBMITTED':
            return Response(
                {"error": "File can only be uploaded for SUBMITTED invoices."},
                status=400
            )

        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided."}, status=400)

        # Validate file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
        if file.content_type not in allowed_types:
            return Response(
                {"error": "Only PDF, JPEG, and PNG files are allowed."},
                status=400
            )

        from django.conf import settings as django_settings
        if getattr(django_settings, 'USE_SUPABASE', False):
            from .supabase_utils import upload_invoice_to_supabase
            file_path = upload_invoice_to_supabase(
                file, vendor.id, invoice.invoice_number
            )
        else:
            import os
            upload_dir = f'media/invoices/{vendor.id}'
            os.makedirs(upload_dir, exist_ok=True)
            file_path = f"{upload_dir}/{invoice.invoice_number}_{file.name}"
            with open(file_path, 'wb') as f:
                for chunk in file.chunks():
                    f.write(chunk)

        invoice.file_url = file_path
        invoice.file_name = file.name
        invoice.save()

        log_action(request.user, 'UPLOAD_INVOICE_FILE', invoice,
                    details={"file": file.name},
                    request=request)

        return Response({
            "message": "Invoice file uploaded successfully.",
            "invoice_number": invoice.invoice_number,
            "file_name": invoice.file_name,
            "file_url": invoice.file_url
        })

    @action(detail=True, methods=['get'])
    def get_invoice_file_url(self, request, pk=None):
        """Get signed URL to download invoice file"""
        invoice = self.get_object()

        if not invoice.file_url:
            return Response(
                {"error": "No file uploaded for this invoice."},
                status=404
            )

        from django.conf import settings as django_settings
        if getattr(django_settings, 'USE_SUPABASE', False):
            from .supabase_utils import get_supabase_signed_url
            signed_url = get_supabase_signed_url(invoice.file_url)
            return Response({
                "invoice_number": invoice.invoice_number,
                "download_url": signed_url,
                "expires_in": "1 hour"
            })
        else:
            return Response({
                "invoice_number": invoice.invoice_number,
                "local_path": invoice.file_url
            })

    @action(detail=True, methods=['post'], permission_classes=[IsFinance])
    def mark_under_review(self, request, pk=None):
        """Finance marks invoice as under review"""
        invoice = self.get_object()

        if invoice.status != 'SUBMITTED':
            return Response(
                {"error": "Only SUBMITTED invoices can be marked as under review."},
                status=400
            )

        invoice.status = 'UNDER_REVIEW'
        invoice.reviewed_by = request.user
        invoice.reviewed_at = timezone.now()
        invoice.save()

        log_action(request.user, 'INVOICE_UNDER_REVIEW', invoice,
                    request=request)

        return Response({
            "message": f"Invoice {invoice.invoice_number} is now under review.",
            "status": invoice.status,
            "reviewed_by": request.user.username,
            "reviewed_at": invoice.reviewed_at
        })

    @action(detail=True, methods=['post'], permission_classes=[IsFinance])
    def review_invoice(self, request, pk=None):
        """Finance approves or rejects invoice"""
        invoice = self.get_object()

        if invoice.status not in ['SUBMITTED', 'UNDER_REVIEW']:
            return Response(
                {"error": f"Cannot review invoice with status '{invoice.status}'."},
                status=400
            )

        serializer = InvoiceReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_value = serializer.validated_data['action']

        with transaction.atomic():
            if action_value == 'APPROVE':
                invoice.status = 'APPROVED'
                invoice.approved_by = request.user
                invoice.approved_at = timezone.now()
                invoice.rejection_reason = ''

            elif action_value == 'REJECT':
                invoice.status = 'REJECTED'
                invoice.rejection_reason = serializer.validated_data['rejection_reason']

            elif action_value == 'UNDER_REVIEW':
                invoice.status = 'UNDER_REVIEW'
                invoice.reviewed_by = request.user
                invoice.reviewed_at = timezone.now()

            invoice.save()

        log_action(request.user, f'INVOICE_{action_value}', invoice,
                    details={
                        "reason": serializer.validated_data.get('rejection_reason', '')
                    },
                    request=request)

        return Response({
            "message": f"Invoice {action_value.lower()}d successfully.",
            "invoice_number": invoice.invoice_number,
            "status": invoice.status
        })

    @action(detail=True, methods=['post'], permission_classes=[IsFinance])
    def record_payment(self, request, pk=None):
        """Finance records payment for approved invoice"""
        invoice = self.get_object()

        if invoice.status != 'APPROVED':
            return Response(
                {"error": "Only APPROVED invoices can be paid."},
                status=400
            )

        if hasattr(invoice, 'payment'):
            return Response(
                {"error": "Payment already recorded for this invoice."},
                status=400
            )

        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validate amount matches invoice
        if serializer.validated_data['amount_paid'] != invoice.amount:
            return Response(
                {
                    "error": f"Payment amount ${serializer.validated_data['amount_paid']} "
                             f"does not match invoice amount ${invoice.amount}."
                },
                status=400
            )

        with transaction.atomic():
            payment = Payment.objects.create(
                invoice=invoice,
                processed_by=request.user,
                **serializer.validated_data
            )

            invoice.status = 'PAID'
            invoice.paid_by = request.user
            invoice.paid_at = timezone.now()
            invoice.save()

            # Update PurchaseRequest to COMPLETED
            invoice.purchase_order.purchase_request.status = PurchaseRequest.Status.COMPLETED
            invoice.purchase_order.purchase_request.save()

        log_action(request.user, 'INVOICE_PAID', invoice,
                    details={
                        "amount": str(payment.amount_paid),
                        "method": payment.payment_method,
                        "reference": payment.payment_reference
                    },
                    request=request)

        # Fire async notification to vendor
        notify_vendor_invoice_paid.delay(invoice.id)

        return Response({
            "message": f"Payment recorded for invoice {invoice.invoice_number}.",
            "invoice_number": invoice.invoice_number,
            "amount_paid": str(payment.amount_paid),
            "payment_method": payment.payment_method,
            "payment_reference": payment.payment_reference,
            "status": invoice.status,
            "purchase_request_status": invoice.purchase_order.purchase_request.status
        })

    # ------------------------------------------------------------------
    # Day 29 — Step 1: Invoice Timeline
    # ------------------------------------------------------------------
    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Return the full audit-log timeline for an invoice."""
        invoice = self.get_object()

        from audit.models import AuditLog
        logs = AuditLog.objects.filter(
            model_name='Invoice',
            object_id=invoice.id
        ).select_related('user').order_by('timestamp')

        timeline = []
        for log in logs:
            timeline.append({
                "action": log.action,
                "performed_by": log.user.username if log.user else "System",
                "role": log.user.role if log.user else "N/A",
                "details": log.details,
                "timestamp": log.timestamp
            })

        return Response({
            "invoice_number": invoice.invoice_number,
            "po_number": invoice.purchase_order.po_number,
            "vendor": invoice.vendor.company_name,
            "amount": str(invoice.amount),
            "current_status": invoice.status,
            "timeline": timeline
        })

    # ------------------------------------------------------------------
    # Day 29 — Step 2: Invoice Summary
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], permission_classes=[IsFinance])
    def summary(self, request):
        """Finance-only summary statistics for all invoices."""
        from django.db.models import Sum, Count, Q
        from django.utils import timezone as tz

        today = tz.now().date()

        stats = Invoice.objects.aggregate(
            total_invoices=Count('id'),
            total_value=Sum('amount'),
            submitted_count=Count('id', filter=Q(status='SUBMITTED')),
            under_review_count=Count('id', filter=Q(status='UNDER_REVIEW')),
            approved_count=Count('id', filter=Q(status='APPROVED')),
            rejected_count=Count('id', filter=Q(status='REJECTED')),
            paid_count=Count('id', filter=Q(status='PAID')),
            overdue_count=Count('id', filter=Q(
                due_date__lt=today,
                status__in=['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
            )),
            total_paid_value=Sum('amount', filter=Q(status='PAID')),
            total_pending_value=Sum('amount', filter=Q(
                status__in=['SUBMITTED', 'UNDER_REVIEW', 'APPROVED']
            ))
        )

        return Response({
            "total_invoices": stats['total_invoices'],
            "total_value": str(stats['total_value'] or 0),
            "total_paid_value": str(stats['total_paid_value'] or 0),
            "total_pending_value": str(stats['total_pending_value'] or 0),
            "overdue_invoices": stats['overdue_count'],
            "by_status": {
                "submitted": stats['submitted_count'],
                "under_review": stats['under_review_count'],
                "approved": stats['approved_count'],
                "rejected": stats['rejected_count'],
                "paid": stats['paid_count'],
            }
        })
