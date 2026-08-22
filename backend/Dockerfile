FROM python:3.11-slim

# System dependencies for WeasyPrint (compatible with Debian Trixie / Bookworm)
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# Allow passing SECRET_KEY at build time (Render: set as a Build Environment Variable)
ARG SECRET_KEY
ENV SECRET_KEY=$SECRET_KEY

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Collect static files for production
RUN python manage.py collectstatic --noinput || true

# Production entrypoint using Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--config", "gunicorn.conf.py"]