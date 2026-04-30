#!/bin/sh

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Seeding users..."
python manage.py seed_users || echo "Seed failed, continuing..."

echo "Starting gunicorn on port ${PORT:-8001}..."
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8001}" \
  --workers 2 \
  --timeout 120
