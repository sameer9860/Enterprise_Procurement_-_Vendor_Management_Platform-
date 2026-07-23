from celery import shared_task
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_spend_report_excel_task(self, start_date=None, end_date=None, user_email=None):
    """Generate spend Excel report asynchronously and upload to Supabase"""
    try:
        from .report_generators import generate_spend_excel_report
        from notifications.emails import send_email

        logger.info("Generating spend Excel report...")
        excel_bytes = generate_spend_excel_report(start_date, end_date)

        file_name = f"spend_report_{start_date or 'all'}_{end_date or 'present'}.xlsx"

        # Upload to Supabase
        file_path = None
        if settings.USE_SUPABASE:
            from procurement.supabase_utils import get_supabase_client
            supabase = get_supabase_client()
            file_path = f"reports/{file_name}"
            supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                path=file_path,
                file=excel_bytes,
                file_options={
                    "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }
            )

            # Get signed URL
            from procurement.supabase_utils import get_supabase_signed_url
            signed_url = get_supabase_signed_url(file_path, expiry_seconds=86400)

            # Email the report link
            if user_email:
                send_email(
                    subject="Your Spend Report is Ready",
                    template_name='report_ready.html',
                    context={
                        'report_name': file_name,
                        'download_url': signed_url,
                        'expires_in': '24 hours',
                    },
                    recipient_list=[user_email]
                )

        logger.info(f"Spend report generated: {file_name}")
        return {'status': 'success', 'file': file_path}

    except Exception as exc:
        logger.error(f"Report generation failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3)
def generate_vendor_report_task(self, start_date=None, end_date=None, user_email=None):
    """Generate vendor performance Excel report asynchronously"""
    try:
        from .report_generators import generate_vendor_performance_excel
        from notifications.emails import send_email

        logger.info("Generating vendor performance report...")
        excel_bytes = generate_vendor_performance_excel(start_date, end_date)

        file_name = f"vendor_performance_{start_date or 'all'}_{end_date or 'present'}.xlsx"

        file_path = None
        if settings.USE_SUPABASE:
            from procurement.supabase_utils import get_supabase_client
            supabase = get_supabase_client()
            file_path = f"reports/{file_name}"
            supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                path=file_path,
                file=excel_bytes,
                file_options={
                    "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }
            )

            if user_email:
                from procurement.supabase_utils import get_supabase_signed_url
                signed_url = get_supabase_signed_url(file_path, expiry_seconds=86400)
                send_email(
                    subject="Your Vendor Performance Report is Ready",
                    template_name='report_ready.html',
                    context={
                        'report_name': file_name,
                        'download_url': signed_url,
                        'expires_in': '24 hours',
                    },
                    recipient_list=[user_email]
                )

        logger.info(f"Vendor report generated: {file_name}")
        return {'status': 'success', 'file': file_path}

    except Exception as exc:
        logger.error(f"Vendor report generation failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3)
def generate_spend_pdf_task(self, start_date=None, end_date=None, user_email=None):
    """Generate spend PDF report asynchronously"""
    try:
        from .report_generators import generate_spend_pdf_report
        from notifications.emails import send_email

        logger.info("Generating spend PDF report...")
        pdf_bytes = generate_spend_pdf_report(start_date, end_date)

        file_name = f"spend_report_{start_date or 'all'}_{end_date or 'present'}.pdf"

        file_path = None
        if settings.USE_SUPABASE:
            from procurement.supabase_utils import get_supabase_client
            supabase = get_supabase_client()
            file_path = f"reports/{file_name}"
            supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                path=file_path,
                file=pdf_bytes,
                file_options={"content-type": "application/pdf"}
            )

            if user_email:
                from procurement.supabase_utils import get_supabase_signed_url
                signed_url = get_supabase_signed_url(file_path, expiry_seconds=86400)
                send_email(
                    subject="Your PDF Spend Report is Ready",
                    template_name='report_ready.html',
                    context={
                        'report_name': file_name,
                        'download_url': signed_url,
                        'expires_in': '24 hours',
                    },
                    recipient_list=[user_email]
                )

        logger.info(f"PDF report generated: {file_name}")
        return {'status': 'success', 'file': file_path}

    except Exception as exc:
        logger.error(f"PDF report generation failed: {exc}")
        raise self.retry(exc=exc)
