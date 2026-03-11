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

class AdmissionMeta(models.Model):
    ADMISSION_TYPE_CHOICES = [('NEW', 'New'), ('RE_ADMISSION', 'Re-Admission')]
    inquiry = models.OneToOneField(Inquiry, on_delete=models.CASCADE, related_name='admission_meta')
    academic_year = models.CharField(max_length=20)
    admission_type = models.CharField(max_length=20, choices=ADMISSION_TYPE_CHOICES, default='NEW')
    previously_applied_year = models.CharField(max_length=20, blank=True, null=True)
    entry_number = models.CharField(max_length=50, unique=True)
    admission_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    scholar_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admission: {self.entry_number} ({self.admission_number or 'Pending'})"

class StudentBio(models.Model):
    admission = models.OneToOneField(AdmissionMeta, on_delete=models.CASCADE, related_name='student_bio')
    first_name = models.CharField(max_length=255)
    middle_name = models.CharField(max_length=255, blank=True, null=True)
    last_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    dob = models.DateField()
    age = models.IntegerField()
    religion = models.CharField(max_length=50, blank=True, null=True)
    caste = models.CharField(max_length=10, choices=[('GEN', 'General'), ('OBC', 'OBC'), ('ST', 'ST'), ('SC', 'SC')])
    family_id = models.CharField(max_length=50, blank=True, null=True)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    height_cm = models.FloatField(blank=True, null=True)
    weight_kg = models.FloatField(blank=True, null=True)
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    samagra_id = models.CharField(max_length=20, blank=True, null=True)
    cwsn = models.BooleanField(default=False)
    cwsn_problem_desc = models.TextField(blank=True, null=True)
    student_photo = models.ImageField(upload_to='student_photos/', blank=True, null=True)

class StudentAddress(models.Model):
    admission = models.OneToOneField(AdmissionMeta, on_delete=models.CASCADE, related_name='address')
    house_no = models.CharField(max_length=100)
    ward_no = models.CharField(max_length=50, blank=True, null=True)
    street = models.CharField(max_length=255)
    village_town = models.CharField(max_length=255)
    tehsil = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    pin_code = models.CharField(max_length=10, blank=True, null=True)

class StudentBankDetails(models.Model):
    admission = models.OneToOneField(AdmissionMeta, on_delete=models.CASCADE, related_name='bank_details')
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    account_holder_name = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    note = models.TextField(blank=True, null=True)

class PreviousAcademic(models.Model):
    admission = models.OneToOneField(AdmissionMeta, on_delete=models.CASCADE, related_name='previous_academic')
    school_name = models.CharField(max_length=255)
    school_type = models.CharField(max_length=20, choices=[('GOVT', 'Government'), ('PRIVATE', 'Private')])
    apaar_id = models.CharField(max_length=50, blank=True, null=True)
    pen_number = models.CharField(max_length=50, blank=True, null=True)
    class_last_attended = models.CharField(max_length=50, blank=True, null=True)
    session_year = models.CharField(max_length=20, blank=True, null=True)
    marks_obtained = models.FloatField(blank=True, null=True)
    total_marks = models.FloatField(blank=True, null=True)
    percentage = models.FloatField(blank=True, null=True)
    pass_fail = models.CharField(max_length=10, choices=[('PASS', 'Pass'), ('FAIL', 'Fail')], blank=True, null=True)

class SiblingDetail(models.Model):
    admission = models.ForeignKey(AdmissionMeta, on_delete=models.CASCADE, related_name='siblings')
    sibling_number = models.IntegerField(choices=[(1, 1), (2, 2), (3, 3)])
    name = models.CharField(max_length=255)
    age = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], blank=True, null=True)
    class_current = models.CharField(max_length=50, blank=True, null=True)
    school_name = models.CharField(max_length=255, blank=True, null=True)

class ParentGuardianDetail(models.Model):
    TYPE_CHOICES = [('FATHER', 'Father'), ('MOTHER', 'Mother'), ('GUARDIAN_1', 'Guardian 1'), ('GUARDIAN_2', 'Guardian 2')]
    admission = models.ForeignKey(AdmissionMeta, on_delete=models.CASCADE, related_name='parents_guardians')
    person_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_single_parent = models.BooleanField(default=False)
    legal_guardian_type = models.CharField(max_length=20, blank=True, null=True)
    name = models.CharField(max_length=255)
    mobile_number = models.CharField(max_length=15)
    occupation = models.CharField(max_length=255, blank=True, null=True)
    educational_qualification = models.CharField(max_length=255, blank=True, null=True)
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    samagra_number = models.CharField(max_length=20, blank=True, null=True)
    relation_with_student = models.CharField(max_length=100, blank=True, null=True)
    office_shop_name = models.CharField(max_length=255, blank=True, null=True)
    job_details = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='parent_photos/', blank=True, null=True)

class Declaration(models.Model):
    admission = models.OneToOneField(AdmissionMeta, on_delete=models.CASCADE, related_name='declaration')
    declaration_accepted = models.BooleanField(default=False)
    guardian_name = models.CharField(max_length=255)
    signature_file = models.ImageField(upload_to='signatures/', blank=True, null=True)
    declaration_date = models.DateField(auto_now_add=True)

class DocumentChecklist(models.Model):
    STATUS_CHOICES = [('SUBMITTED', 'Submitted'), ('NOT_SUBMITTED', 'Not Submitted')]
    admission = models.OneToOneField(AdmissionMeta, on_delete=models.CASCADE, related_name='document_checklist')
    birth_certificate = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_SUBMITTED')
    previous_marksheet = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_SUBMITTED')
    student_photos_3 = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_SUBMITTED')
    sc_st_obc_certificate = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_SUBMITTED')
    parent_affidavit = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_SUBMITTED')
    scholarship_letter = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_SUBMITTED')
    transfer_certificate = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_SUBMITTED')
    form_received_complete = models.BooleanField(default=False)
    received_by_name = models.CharField(max_length=255, blank=True, null=True)
    principal_sign_date = models.DateField(blank=True, null=True)
    any_other_details = models.TextField(blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)

class StudentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    admission_meta = models.OneToOneField(AdmissionMeta, on_delete=models.CASCADE, related_name='profile', null=True, blank=True)
    admission_step = models.IntegerField(default=1) 
    is_fully_admitted = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile: {self.user.email} - Step {self.admission_step}"
