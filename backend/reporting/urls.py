from django.urls import path
from .views import (
    SpendSummaryView,
    SpendByDepartmentView,
    SpendByMonthView,
    SpendByQuarterView,
    SpendByCategoryView,
    VendorPerformanceView,
    VendorBidComparisonView,
    ProcurementPipelineView,
    InvoiceReportView,
    OverdueInvoicesView,
    RequestSpendReportView,
    DownloadSpendReportView,
    DownloadVendorReportView,
    DownloadSpendPDFView,
    TaskStatusView,
)

urlpatterns = [
    # Spend reports
    path('spend/summary/', SpendSummaryView.as_view(), name='spend-summary'),
    path('spend/by-department/', SpendByDepartmentView.as_view(), name='spend-department'),
    path('spend/by-month/', SpendByMonthView.as_view(), name='spend-month'),
    path('spend/by-quarter/', SpendByQuarterView.as_view(), name='spend-quarter'),
    path('spend/by-category/', SpendByCategoryView.as_view(), name='spend-category'),

    # Vendor reports
    path('vendors/performance/', VendorPerformanceView.as_view(), name='vendor-performance'),
    path('vendors/bid-comparison/', VendorBidComparisonView.as_view(), name='vendor-bid-comparison'),

    # Pipeline
    path('pipeline/', ProcurementPipelineView.as_view(), name='procurement-pipeline'),

    # Invoice reports
    path('invoices/', InvoiceReportView.as_view(), name='invoice-report'),
    path('invoices/overdue/', OverdueInvoicesView.as_view(), name='overdue-invoices'),

    # Report downloads
    path('download/spend/excel/', DownloadSpendReportView.as_view(), name='download-spend-excel'),
    path('download/spend/pdf/', DownloadSpendPDFView.as_view(), name='download-spend-pdf'),
    path('download/vendors/excel/', DownloadVendorReportView.as_view(), name='download-vendor-excel'),

    # Async report generation
    path('generate/spend/', RequestSpendReportView.as_view(), name='generate-spend-report'),

    # Task status
    path('tasks/<str:task_id>/', TaskStatusView.as_view(), name='task-status'),
]