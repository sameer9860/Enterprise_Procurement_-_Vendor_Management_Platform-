from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import PurchaseRequestViewSet, VendorViewSet, VendorCategoryViewSet, RFQViewSet

router = DefaultRouter()
router.register('requests', PurchaseRequestViewSet, basename='purchase-request')
router.register('vendors', VendorViewSet, basename='vendor')
router.register('vendor-categories', VendorCategoryViewSet, basename='vendor-category')
router.register('rfqs', RFQViewSet, basename='rfq')

urlpatterns = [
    path('', include(router.urls)),

]
