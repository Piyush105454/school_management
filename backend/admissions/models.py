from django.db import models
from django.conf import settings

class Inquiry(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SHORTLISTED', 'Shortlisted'),
        ('REJECTED', 'Rejected'),
    ]

    student_name = models.CharField(max_length=255)
    parent_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    applied_class = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    entry_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student_name} ({self.status}) - {self.entry_number or 'Un-numbered'}"

class StudentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    inquiry = models.OneToOneField(Inquiry, on_delete=models.CASCADE, related_name='profile')
    
    # Step 2: Detailed Admission Form fields
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    blood_group = models.CharField(max_length=5, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=255, null=True, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, null=True, blank=True)
    previous_school = models.CharField(max_length=255, null=True, blank=True)
    
    # Progress Logic
    admission_step = models.IntegerField(default=1) # 1: Inquiry, 2: Form Pending, 3: Document Verification, etc.
    is_fully_admitted = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Profile: {self.user.username} - Step {self.admission_step}"
