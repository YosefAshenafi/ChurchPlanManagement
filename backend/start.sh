#!/bin/sh
set -e

echo "=== Starting Django setup ==="
echo "PORT: ${PORT:-8001}"
echo "DATABASE_URL set: $(if [ -n "$DATABASE_URL" ]; then echo 'YES'; else echo 'NO'; fi)"

# Wait for database to be ready
echo "Waiting for database..."
python -c "
import os, time, psycopg
from urllib.parse import urlparse

url = urlparse(os.environ.get('DATABASE_URL', ''))
if url.hostname:
    for i in range(30):
        try:
            conn = psycopg.connect(
                host=url.hostname,
                port=url.port or 5432,
                user=url.username,
                password=url.password,
                dbname=url.path.lstrip('/'),
                connect_timeout=2
            )
            conn.close()
            print('  Database is ready!')
            break
        except Exception as e:
            print(f'  Attempt {i+1}/30: {e}')
            time.sleep(2)
    else:
        print('  ERROR: Database not ready after 30 attempts')
        exit(1)
"

# Run migrations
echo "=== Running migrations ==="
python manage.py migrate --noinput --verbosity 2

# Seed users (creates/updates default admin)
echo "=== Running seed_users ==="
python manage.py seed_users

# Verify admin exists
echo "=== Verifying admin account ==="
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
admins = User.objects.filter(is_superuser=True)
print(f'Total superusers: {admins.count()}')
for u in admins:
    print(f'  - Username: {u.username}, Email: {u.email}, Role: {u.role}')
if not admins.exists():
    print('  ERROR: No superuser found!')
    exit(1)
"

echo "=== Starting gunicorn ==="
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8001}" \
  --workers "${GUNICORN_WORKERS:-2}" \
  --timeout 120 \
  --access-logfile -
