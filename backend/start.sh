#!/bin/sh
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput
if [ -n "$DJANGO_SUPERUSER_USERNAME" ]; then
  python manage.py createsuperuser --noinput || true
fi
python manage.py seed_users || true
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8001}" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --timeout 120 \
  --access-logfile -
