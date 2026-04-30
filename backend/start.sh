#!/bin/sh
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Create superuser via env vars (Railway native method)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ]; then
  echo "Creating superuser from DJANGO_SUPERUSER_* vars..."
  python manage.py createsuperuser --noinput
fi

# Seed users (includes default admin from DEFAULT_ADMIN_* vars)
echo "Running seed_users..."
python manage.py seed_users

# Verify admin exists
echo "Verifying admin account exists..."
python manage.py shell -c "from django.contrib.auth import get_user_model; User=get_user_model(); print(f'Admin exists: {User.objects.filter(is_superuser=True).exists()}')"

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8001}" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --timeout 120 \
  --access-logfile -
