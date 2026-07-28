import re
from django.core.exceptions import ValidationError


def validate_strong_password(password):
    """
    Password must be:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long.")

    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter.")

    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain at least one lowercase letter.")

    if not re.search(r'\d', password):
        raise ValidationError("Password must contain at least one digit.")

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("Password must contain at least one special character.")


def validate_phone_number(phone):
    """Basic phone number validation"""
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    if not cleaned.isdigit():
        raise ValidationError("Phone number must contain only digits.")
    if not (7 <= len(cleaned) <= 15):
        raise ValidationError("Phone number must be between 7 and 15 digits.")


def validate_file_size(file, max_mb=10):
    """Validate uploaded file size"""
    max_bytes = max_mb * 1024 * 1024
    if file.size > max_bytes:
        raise ValidationError(f"File size must not exceed {max_mb}MB.")


def validate_file_extension(file, allowed_extensions=None):
    """Validate uploaded file extension"""
    if allowed_extensions is None:
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png']

    ext = file.name.split('.')[-1].lower()
    if ext not in allowed_extensions:
        raise ValidationError(
            f"File type '{ext}' not allowed. "
            f"Allowed types: {', '.join(allowed_extensions)}"
        )
