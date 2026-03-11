import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from admissions.models import StudentProfile
from admissions.serializers import StudentProfileSerializer
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(email='teststudent@example.com')
profile = StudentProfile.objects.filter(user=user).first()
if profile:
    print(f"Profile User: {profile.user.email}")
    print(f"Admission Meta: {profile.admission_meta}")
    if profile.admission_meta:
        print(f"Meta ID: {profile.admission_meta.id}")
        print(f"Meta Entry: {profile.admission_meta.entry_number}")
else:
    print("No profile found")
