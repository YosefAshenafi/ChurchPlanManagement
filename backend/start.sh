#!/bin/sh

echo "=== Starting Django setup ==="
echo "PORT: ${PORT:-8001}"

# Run migrations
echo "=== Running migrations ==="
python manage.py migrate --noinput

# Collect static files
echo "=== Collecting static files ==="
python manage.py collectstatic --noinput

# Seed users (creates/updates default admin)
echo "=== Running seed_users ==="
python manage.py seed_users

# Verify admin exists (write to temp file to avoid quote issues)
echo "=== Verifying admin account ==="
python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
admins = User.objects.filter(is_superuser=True)
print(f'Total superusers: {admins.count()}')
for u in admins:
    print(f'  - Username: {u.username}, Email: {u.email}, Role: {u.role}')
if not admins.exists():
    print('  ERROR: No superuser found!')
EOF

echo "=== Starting gunicorn ==="
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8001}" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --timeout 120 \
  --access-logfile -
