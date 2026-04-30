#!/bin/sh

echo "=== Environment Info ==="
echo "PORT from env: ${PORT:-not set}"
echo "Using port: 99"

echo "=== Running migrations ==="
python manage.py migrate --noinput

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput

echo "=== Seeding users ==="
python manage.py seed_users || echo "Seed failed, continuing..."

echo "=== Starting gunicorn on 0.0.0.0:99 ==="
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:99" \
  --workers 2 \
  --timeout 120
