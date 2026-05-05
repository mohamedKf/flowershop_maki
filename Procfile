release: python manage.py collectstatic --noinput
web: python manage.py migrate --noinput && python manage.py seed_demo && gunicorn flowershop.wsgi --log-file -