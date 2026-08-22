#!/usr/bin/env bash
set -o errexit

# Install WeasyPrint system dependencies if apt-get is available
if command -v apt-get &> /dev/null; then
  apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    shared-mime-info || true
fi

# Install Python dependencies
pip install -r requirements.txt

# Django setup
python manage.py collectstatic --noinput
python manage.py migrate --noinput

# Auto-create superuser on free tier deployment
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); username = '${ADMIN_USERNAME:-admin}'; email = '${ADMIN_EMAIL:-admin@example.com}'; password = '${ADMIN_PASSWORD:-AdminPass123!}'; User.objects.create_superuser(username, email, password, role='ADMIN') if not User.objects.filter(username=username).exists() else print('Superuser already exists.')"
