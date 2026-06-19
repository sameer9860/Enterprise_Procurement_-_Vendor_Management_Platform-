from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import PurchaseRequestViewSet

router = DefaultRouter()
router.register('requests', PurchaseRequestViewSet, basename='purchase-request')

urlpatterns = [
    path('', include(router.urls)),
]
