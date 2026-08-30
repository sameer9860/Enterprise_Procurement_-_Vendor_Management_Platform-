from rest_framework import permissions

class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'EMPLOYEE'


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'MANAGER'


class IsProcurement(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['PROCUREMENT', 'ADMIN']


class IsFinance(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['FINANCE', 'ADMIN']


class IsVendor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'VENDOR'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == 'ADMIN' or request.user.is_superuser or request.user.is_staff
        )


class IsManagerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ['MANAGER', 'ADMIN'] or request.user.is_superuser or request.user.is_staff
        )


class IsProcurementOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ['PROCUREMENT', 'ADMIN'] or request.user.is_superuser or request.user.is_staff
        )


class IsFinanceOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ['FINANCE', 'ADMIN'] or request.user.is_superuser or request.user.is_staff
        )


class IsOwnerOrManager(permissions.BasePermission):
    """Object-level permission: owner can view/edit their own request, manager can view team requests"""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['ADMIN'] or request.user.is_superuser or request.user.is_staff:
            return True
        if hasattr(obj, 'requester') and obj.requester == request.user:
            return True
        if request.user.role == 'MANAGER' and hasattr(obj, 'requester') and obj.requester.department == request.user.department:
            return True
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object level — owner can edit, others can only read.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['ADMIN'] or request.user.is_superuser or request.user.is_staff:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'requester'):
            return obj.requester == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsSameVendor(permissions.BasePermission):
    """
    Vendor can only access their own profile and related objects.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['ADMIN', 'PROCUREMENT', 'FINANCE', 'MANAGER'] or request.user.is_superuser or request.user.is_staff:
            return True
        try:
            vendor_profile = request.user.vendor_profile
            if hasattr(obj, 'vendor'):
                return obj.vendor == vendor_profile
            if hasattr(obj, 'user'):
                return obj.user == request.user
        except Exception:
            return False
        return False


class CanAccessDepartmentData(permissions.BasePermission):
    """
    Manager can only access data from their own department.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['ADMIN', 'PROCUREMENT', 'FINANCE'] or request.user.is_superuser or request.user.is_staff:
            return True
        if request.user.role == 'MANAGER':
            if hasattr(obj, 'department'):
                return obj.department == request.user.department
            if hasattr(obj, 'purchase_request'):
                return obj.purchase_request.department == request.user.department
        if request.user.role == 'EMPLOYEE':
            if hasattr(obj, 'requester'):
                return obj.requester == request.user
        return False