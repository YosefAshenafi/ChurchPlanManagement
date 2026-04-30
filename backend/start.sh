#!/bin/sh

echo "=== Environment ==="
echo "PORT: ${PORT:-8080}"
echo "DATABASE_URL set: $(if [ -n "$DATABASE_URL" ]; then echo 'YES'; else echo 'NO'; fi)"
echo "DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE:-not set}"

echo "=== Testing Django setup ==="
python -c "import django; print(f'Django version: {django.__version__}')" || echo "Django import FAILED"

echo "=== Running migrations ==="
python manage.py migrate --noinput || echo "Migrations FAILED"

echo "=== Starting gunicorn on 0.0.0.0:${PORT:-8080} ==="
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers 1 \
  --timeout 120 \
  --log-level debug
