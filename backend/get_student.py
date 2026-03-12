import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
student = User.objects.filter(role='student').first()
if student:
    student.set_password('student123')
    student.save()
    print(f"Student Email: {student.email}")
    print("Password: student123")
else:
    u = User.objects.create_user(email='student@example.com', password='student123', role='student')
    print("Created new student.")
    print(f"Student Email: {u.email}")
    print("Password: student123")
