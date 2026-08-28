#!/bin/sh
set -e

# Run database migrations and collect static files at container start.
# Use || true to avoid failing when configuration isn't present in some environments.
echo "[entrypoint] Running migrations..."
python manage.py migrate --noinput || echo "[entrypoint] Migrate failed or skipped"

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput || echo "[entrypoint] Collectstatic failed or skipped"

# Auto-create superuser if ADMIN_* env vars are provided
if [ -n "${ADMIN_USERNAME:-}" ]; then
  echo "[entrypoint] Ensuring superuser exists..."
  python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); username = '${ADMIN_USERNAME:-admin}'; email = '${ADMIN_EMAIL:-admin@example.com}'; password = '${ADMIN_PASSWORD:-AdminPass123!}'; User.objects.create_superuser(username, email, password, role='ADMIN') if not User.objects.filter(username=username).exists() else print('Superuser already exists.')" || echo "[entrypoint] Superuser creation failed or skipped"
fi

if ! command -v gunicorn >/dev/null 2>&1; then
  echo "[entrypoint] ERROR: gunicorn not found — ensure it is listed in requirements.txt"
  exit 127
fi

# Exec the container CMD
exec "$@"
