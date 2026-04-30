#!/bin/sh

# Set Django settings
export DJANGO_SETTINGS_MODULE=config.settings

echo "=== Starting Django with settings: $DJANGO_SETTINGS_MODULE ==="

# Run migrations
python manage.py migrate --noinput

# Start gunicorn
echo "=== Starting gunicorn on 0.0.0.0:${PORT:-8080} ==="
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers 1 \
  --timeout 120 \
  --log-level debug
