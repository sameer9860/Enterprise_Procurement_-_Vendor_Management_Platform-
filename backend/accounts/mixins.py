from rest_framework.exceptions import PermissionDenied

class RoleRequiredMixin:
    allowed_roles = []

    def check_permissions(self, request):
        super().check_permissions(request)
        if self.allowed_roles and request.user.role not in self.allowed_roles:
            raise PermissionDenied(f"Only {', '.join(self.allowed_roles)} can perform this action.")