#!/bin/sh

echo "=== Environment Info ==="
echo "PORT from env: ${PORT:-not set}"

# Use PORT from Railway, default to 8080 (Railway's default)
LISTEN_PORT="${PORT:-8080}"
echo "Gunicorn will listen on: $LISTEN_PORT"

echo "=== Running migrations ==="
python manage.py migrate --noinput

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput

echo "=== Seeding users ==="
python manage.py seed_users || echo "Seed failed, continuing..."

echo "=== Starting gunicorn ==="
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:$LISTEN_PORT" \
  --workers 2 \
  --timeout 120
