import os
import django
import json
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from admissions.models import StudentProfile
from admissions.serializers import StudentProfileSerializer
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(email='teststudent@example.com')
profile = StudentProfile.objects.get(user=user)
serializer = StudentProfileSerializer(profile)
print(json.dumps(serializer.data, indent=2))
