import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from admissions.models import StudentProfile, AdmissionMeta

profiles = StudentProfile.objects.all()
print(f"Total Profiles: {profiles.count()}")
for p in profiles:
    print(f"User: {p.user.email}, Step: {p.admission_step}, Meta ID: {p.admission_meta_id if p.admission_meta else 'MISSING'}")

metas = AdmissionMeta.objects.all()
print(f"\nTotal Metas: {metas.count()}")
for m in metas:
    print(f"Meta ID: {m.id}, Inquiry: {m.inquiry.email}, Entry: {m.entry_number}")
