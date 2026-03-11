import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from admissions.models import Inquiry, StudentProfile, AdmissionMeta

# 1. Get the shortlisted inquiry
inquiry = Inquiry.objects.filter(email='teststudent@example.com', status='SHORTLISTED').first()
if inquiry:
    print(f"Found inquiry: {inquiry.email}")
    
    # 2. Check if AdmissionMeta exists for it
    admission_meta, created = AdmissionMeta.objects.get_or_create(
        inquiry=inquiry,
        defaults={
            'academic_year': inquiry.academic_year,
            'entry_number': inquiry.entry_number or f"INQ-2026-FIX",
            'admission_type': 'NEW'
        }
    )
    if created:
        print(f"Created missing AdmissionMeta: {admission_meta.entry_number}")
    else:
        print(f"Existing AdmissionMeta found: {admission_meta.entry_number}")

    # 3. Link to StudentProfile
    profile = StudentProfile.objects.filter(user__email=inquiry.email).first()
    if profile:
        profile.admission_meta = admission_meta
        profile.admission_step = 2 # Ensure it's at step 2
        profile.save()
        print(f"Linked AdmissionMeta to Profile for {profile.user.email} and set step 2")
    else:
        print("StudentProfile not found for this email.")
else:
    print("No shortlisted inquiry found for teststudent@example.com")
