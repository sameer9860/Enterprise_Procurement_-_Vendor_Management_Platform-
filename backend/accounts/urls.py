from django.urls import path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, ProfileView, ThrottledTokenObtainPairView, LogoutView

def auth_root(request):
    return JsonResponse({
        'message': 'Authentication & User Accounts API',
        'endpoints': {
            'login': '/api/auth/login/',
            'register': '/api/auth/register/',
            'refresh': '/api/auth/login/refresh/',
            'logout': '/api/auth/logout/',
            'profile': '/api/auth/profile/',
        }
    })

urlpatterns = [
    path('', auth_root, name='auth_root'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
]