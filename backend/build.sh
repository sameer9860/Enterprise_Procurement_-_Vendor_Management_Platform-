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

# Note: don't run Django management commands here — run them at container start
# (migrations and collectstatic require runtime env vars which aren't available during image build).
