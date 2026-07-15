import os
from celery import Celery

# Set default Django settings module for the Celery 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('procurement_platform')

# Use Django's CELERY_* settings (namespace avoids clashes).
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks.py in all INSTALLED_APPS.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Simple connectivity test — run via: debug_task.delay()"""
    print(f'Request: {self.request!r}')
