import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

users = User.objects.all()
if not users.exists():
    print("No users found.")
else:
    for user in users:
        print(f"Email: {user.email}, Role: {user.role}, IsSuperuser: {user.is_superuser}")
