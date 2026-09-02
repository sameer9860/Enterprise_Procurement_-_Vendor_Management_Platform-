import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department
from .validators import validate_strong_password, validate_phone_number

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'budget', 'manager']


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_strong_password]
    )
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'department', 'department_name', 'phone_number']

    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError(
                "Username must be at least 3 characters."
            )
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )
        return value

    def validate_email(self, value):
        if not value:
            return value
        cleaned = value.lower().strip()
        if User.objects.filter(email__iexact=cleaned).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return cleaned

    def validate_phone_number(self, value):
        if value:
            validate_phone_number(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == 'VENDOR':
            from procurement.models import Vendor
            Vendor.objects.get_or_create(
                user=user,
                defaults={
                    'company_name': user.username,
                    'registration_number': f"REG-{user.id}",
                    'address': 'N/A',
                    'city': 'N/A',
                    'country': 'N/A',
                    'status': 'ACTIVE',
                }
            )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'department', 'phone_number']
        read_only_fields = ['role']


class AdminUserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'department', 'department_name', 'phone_number',
            'is_active', 'is_staff', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'date_joined']
