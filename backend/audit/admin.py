from django.contrib import admin
from .models import AuditLog

# Register your models here.


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'model_name', 'object_id', 'timestamp')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('user__username', 'model_name', 'object_repr')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
