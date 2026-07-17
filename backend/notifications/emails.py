from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_email(subject, template_name, context, recipient_list):
    """Base email sender using Django templates"""
    try:
        html_content = render_to_string(f'emails/{template_name}', context)
        text_content = f"Procurement Platform Notification\n\n{subject}"

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipient_list
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        logger.info(f"Email sent: {subject} → {recipient_list}")
        return True
    except Exception as e:
        logger.error(f"Email failed: {subject} → {e}")
        return False
