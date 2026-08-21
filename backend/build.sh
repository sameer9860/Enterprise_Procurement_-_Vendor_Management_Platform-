#!/usr/bin/env bash
set -o errexit

# Install WeasyPrint system dependencies if apt-get is available
if command -v apt-get &> /dev/null; then
  apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info || true
fi

# Install Python dependencies
pip install -r requirements.txt

# Django setup
python manage.py collectstatic --noinput
python manage.py migrate --noinput
