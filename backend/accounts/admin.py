from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Department

class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'department', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Procurement Info', {'fields': ('role', 'department', 'phone_number')}),
    )
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'budget', 'manager']    

admin.site.register(User, CustomUserAdmin)
admin.site.register(Department, DepartmentAdmin)
