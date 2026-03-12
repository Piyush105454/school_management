import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = "admin@example.com"
password = "password123"

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password, role='OFFICE')
    print(f"Superuser created successfully: {email}")
else:
    print(f"User {email} already exists.")
