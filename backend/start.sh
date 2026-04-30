#!/bin/sh
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Seed users (creates/updates default admin from DEFAULT_ADMIN_* vars)
echo "Running seed_users..."
python manage.py seed_users

# Verify admin exists and show username
echo "Verifying admin account..."
python manage.py shell -c "from django.contrib.auth import get_user_model; User=get_user_model(); u=User.objects.filter(is_superuser=True).first(); print(f'Admin exists: {u is not None}, Username: {u.username if u else None}')"

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8001}" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --timeout 120 \
  --access-logfile -
