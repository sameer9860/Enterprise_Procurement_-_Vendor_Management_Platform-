#!/bin/sh
set -e

echo "[entrypoint] Running migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

if [ -n "${ADMIN_USERNAME:-}" ]; then
  echo "[entrypoint] Ensuring superuser exists..."
  python manage.py ensure_superuser
fi

if ! command -v gunicorn >/dev/null 2>&1; then
  echo "[entrypoint] ERROR: gunicorn not found — ensure it is listed in requirements.txt"
  exit 127
fi

# Exec the container CMD
exec "$@"
