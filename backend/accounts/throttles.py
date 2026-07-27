from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Strict throttle for login endpoint — prevents brute force"""
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    """Limit registration attempts"""
    scope = 'register'


class PasswordResetThrottle(AnonRateThrottle):
    """Limit password reset attempts"""
    scope = 'password_reset'


class VendorBidThrottle(UserRateThrottle):
    """Limit bid submissions per vendor"""
    scope = 'vendor_bid'


class ReportDownloadThrottle(UserRateThrottle):
    """Limit report downloads"""
    scope = 'report_download'
