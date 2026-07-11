from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    PurchaseRequestViewSet, VendorViewSet, VendorCategoryViewSet,
    RFQViewSet, BidViewSet, PurchaseOrderViewSet, InvoiceViewSet
)

router = DefaultRouter()
router.register('requests', PurchaseRequestViewSet, basename='purchase-request')
router.register('vendors', VendorViewSet, basename='vendor')
router.register('vendor-categories', VendorCategoryViewSet, basename='vendor-category')
router.register('rfqs', RFQViewSet, basename='rfq')
router.register('bids', BidViewSet, basename='bid')
router.register('purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register('invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),

]
