from django.contrib import admin
from .models import PurchaseRequest,PurchaseOrder,POItem,RequestItem,Approval,RFQ,RFQItem,Vendor,VendorCategory,VendorDocument,Bid,BidItem,Invoice,InvoiceItem,Payment


class PurchaseRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'requester_name', 'department_name', 'estimated_budget', 'status', 'item_count', 'created_at']

    def requester_name(self, obj):
        return obj.requester.username
    requester_name.short_description = 'Requester'

    def department_name(self, obj):
        return obj.department.name
    department_name.short_description = 'Department'

    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Item Count'
    
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ['id', 'request', 'approver', 'action', 'comments', 'created_at']     
    
class RequestItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'request', 'item_name', 'quantity', 'estimated_unit_price', 'specifications', 'estimated_total']
    
admin.site.register(PurchaseRequest,PurchaseRequestAdmin)

admin.site.register(RequestItem,RequestItemAdmin)

admin.site.register(PurchaseOrder)

admin.site.register(POItem)

admin.site.register(Approval,ApprovalAdmin)

admin.site.register(RFQ)

admin.site.register(RFQItem)

admin.site.register(Vendor)

admin.site.register(VendorCategory)

admin.site.register(VendorDocument)

admin.site.register(Bid)

admin.site.register(BidItem)

admin.site.register(Invoice)

admin.site.register(InvoiceItem)

admin.site.register(Payment)

