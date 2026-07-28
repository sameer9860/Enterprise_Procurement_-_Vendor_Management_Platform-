import bleach
import re


def sanitize_string(value, max_length=None):
    """Strip HTML tags and dangerous characters from string inputs"""
    if not isinstance(value, str):
        return value

    # Strip all HTML tags
    value = bleach.clean(value, tags=[], strip=True)

    # Remove null bytes
    value = value.replace('\x00', '')

    # Strip leading/trailing whitespace
    value = value.strip()

    if max_length:
        value = value[:max_length]

    return value


def sanitize_dict(data):
    """Recursively sanitize all string values in a dict"""
    if isinstance(data, dict):
        return {k: sanitize_dict(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_dict(item) for item in data]
    elif isinstance(data, str):
        return sanitize_string(data)
    return data
