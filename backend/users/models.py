from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    OFFICE = 'OFFICE'
    STUDENT_PARENT = 'STUDENT_PARENT'
    
    ROLE_CHOICES = [
        (OFFICE, 'Office Staff'),
        (STUDENT_PARENT, 'Student/Parent'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=OFFICE)
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
