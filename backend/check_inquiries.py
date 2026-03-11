import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from admissions.models import Inquiry, StudentProfile, AdmissionMeta

inquiries = Inquiry.objects.all()
print(f"Total Inquiries: {inquiries.count()}")
for i in inquiries:
    print(f"ID: {i.id}, Email: {i.email}, Status: {i.status}")

profiles = StudentProfile.objects.all()
for p in profiles:
    print(f"Profile User: {p.user.email}")
