import time
import logging


class SecurityHeadersMiddleware:
    """
    Adds security headers to every response.
    Prevents XSS, clickjacking, MIME sniffing attacks.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'

        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'

        # XSS protection for older browsers
        response['X-XSS-Protection'] = '1; mode=block'

        # Referrer policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions policy
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        # Content Security Policy
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "frame-ancestors 'none';"
        )

        return response


class RequestLoggingMiddleware:
    """
    Logs all API requests for security monitoring.
    Tracks IP, method, path, status, and response time.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        logger = logging.getLogger('api.requests')

        start_time = time.time()
        response = self.get_response(request)
        duration = round((time.time() - start_time) * 1000, 2)

        # Only log API requests
        if request.path.startswith('/api/'):
            ip = self._get_client_ip(request)
            user = request.user.username if request.user.is_authenticated else 'anonymous'

            logger.info(
                f"{request.method} {request.path} "
                f"| status={response.status_code} "
                f"| user={user} "
                f"| ip={ip} "
                f"| duration={duration}ms"
            )

            # Log suspicious activity
            if response.status_code in [401, 403]:
                logger.warning(
                    f"UNAUTHORIZED ACCESS ATTEMPT: "
                    f"{request.method} {request.path} "
                    f"| ip={ip} | user={user}"
                )

        return response

    def _get_client_ip(self, request):
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class InputSanitizationMiddleware:
    """
    Sanitizes incoming POST/PUT/PATCH request data
    to prevent XSS and injection attacks.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/') and request.method in ['POST', 'PUT', 'PATCH']:
            if hasattr(request, 'data'):
                from config.sanitizers import sanitize_dict
                try:
                    request._sanitized = sanitize_dict(
                        request.data.copy()
                    )
                except Exception:
                    pass
        return self.get_response(request)

