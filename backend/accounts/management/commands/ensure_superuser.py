import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create a superuser from ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD env vars.'

    def handle(self, *args, **options):
        username = os.environ.get('ADMIN_USERNAME', '').strip()
        if not username:
            self.stdout.write('ADMIN_USERNAME not set — skipping superuser creation.')
            return

        email = os.environ.get('ADMIN_EMAIL', '').strip()
        password = os.environ.get('ADMIN_PASSWORD', '').strip()
        if not password:
            self.stderr.write(
                self.style.WARNING('ADMIN_PASSWORD is not set — skipping superuser creation.')
            )
            return

        User = get_user_model()
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'Superuser "{username}" already exists.'))
            return

        User.objects.create_superuser(username, email, password, role='ADMIN')
        self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created.'))
