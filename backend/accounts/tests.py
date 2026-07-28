from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from accounts.validators import validate_strong_password, validate_phone_number

User = get_user_model()


class SecurityValidationTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_strong_password_validator(self):
        # Weak passwords should raise ValidationError
        with self.assertRaises(ValidationError):
            validate_strong_password("short")

        with self.assertRaises(ValidationError):
            validate_strong_password("nopassword123!")

        with self.assertRaises(ValidationError):
            validate_strong_password("NOUPPERCASE123!")

        with self.assertRaises(ValidationError):
            validate_strong_password("NoSpecial123")

        # Valid strong password should pass without exception
        try:
            validate_strong_password("ValidP@ssword123")
        except ValidationError:
            self.fail("validate_strong_password raised ValidationError unexpectedly!")

    def test_phone_number_validator(self):
        with self.assertRaises(ValidationError):
            validate_phone_number("123")  # too short

        with self.assertRaises(ValidationError):
            validate_phone_number("abc1234567")  # non-digits

        try:
            validate_phone_number("+977-9800000000")
        except ValidationError:
            self.fail("validate_phone_number raised ValidationError unexpectedly!")

    def test_registration_with_weak_password(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'secuser',
            'email': 'secuser@test.com',
            'password': 'weak',
            'role': 'EMPLOYEE'
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn('password', resp.data)

    def test_logout_and_token_blacklisting(self):
        # Register user with strong password
        reg_resp = self.client.post('/api/auth/register/', {
            'username': 'logoutuser',
            'email': 'logoutuser@test.com',
            'password': 'StrongP@ssword123',
            'role': 'EMPLOYEE'
        })
        self.assertEqual(reg_resp.status_code, 201)

        # Login to get tokens
        login_resp = self.client.post('/api/auth/login/', {
            'username': 'logoutuser',
            'password': 'StrongP@ssword123'
        })
        self.assertEqual(login_resp.status_code, 200)
        access_token = login_resp.data['access']
        refresh_token = login_resp.data['refresh']

        # Call logout endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_resp = self.client.post('/api/auth/logout/', {
            'refresh': refresh_token
        })
        self.assertEqual(logout_resp.status_code, 200)
        self.assertEqual(logout_resp.data['message'], 'Logged out successfully.')

        # Attempt to use blacklisted refresh token
        self.client.credentials()  # clear auth header
        refresh_resp = self.client.post('/api/auth/login/refresh/', {
            'refresh': refresh_token
        })
        self.assertEqual(refresh_resp.status_code, 401)
