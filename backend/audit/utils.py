from .models import AuditLog

def log_action(user, action, instance, details=None, request=None):
    ip = None
    if request:
        ip = request.META.get('REMOTE_ADDR')

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=instance.pk,
        object_repr=str(instance)[:255],
        details=details or {},
        ip_address=ip
    )