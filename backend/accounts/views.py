from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from .serializers import UserSerializer, UserProfileSerializer
from .throttles import LoginRateThrottle, RegisterRateThrottle

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    @extend_schema(
        tags=['Auth'],
        summary='Register new user',
        description='Create a new user account with a specific role.'
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]

    @extend_schema(
        tags=['Auth'],
        summary='Obtain JWT token pair',
        description='Authenticate with username and password to receive access and refresh tokens.'
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Auth'],
        summary='Get current user profile',
        responses={200: UserProfileSerializer}
    )
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        tags=['Auth'],
        summary='Update user profile',
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer}
    )
    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Auth'],
        summary='Logout user',
        description='Blacklist the refresh token to logout.',
        request=OpenApiTypes.OBJECT,
        responses={200: OpenApiTypes.OBJECT}
    )
    def post(self, request):
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=400
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Logged out successfully."},
                status=200
            )
        except TokenError as e:
            return Response(
                {"error": f"Invalid token: {str(e)}"},
                status=400
            )


