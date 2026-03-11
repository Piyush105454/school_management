import random
import string
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Inquiry, StudentProfile, AdmissionMeta, StudentBio, StudentAddress, StudentBankDetails, PreviousAcademic, SiblingDetail, ParentGuardianDetail, Declaration, DocumentChecklist
from .serializers import InquirySerializer, StudentProfileSerializer, AdmissionMetaSerializer

User = get_user_model()

class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer

    def perform_create(self, serializer):
        entry_number = f"INQ-2026-{random.randint(1000, 9999)}"
        serializer.save(entry_number=entry_number)

    @action(detail=True, methods=['post'])
    def shortlist(self, request, pk=None):
        inquiry = self.get_object()
        inquiry.status = 'SHORTLISTED'
        inquiry.save()

        # 1. Check if user already exists
        if User.objects.filter(email=inquiry.email).exists():
            return Response({'message': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Create User
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        user = User.objects.create_user(
            email=inquiry.email,
            password=password,
            role=User.STUDENT_PARENT
        )

        # 3. Create AdmissionMeta
        admission_meta = AdmissionMeta.objects.create(
            inquiry=inquiry,
            academic_year=inquiry.academic_year,
            entry_number=inquiry.entry_number,
            admission_type='NEW'
        )

        # 4. Create StudentProfile
        StudentProfile.objects.create(
            user=user,
            admission_meta=admission_meta,
            admission_step=2
        )

        return Response({
            'message': 'Student shortlisted and user created',
            'email': inquiry.email,
            'password': password
        })

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = AdmissionMeta.objects.all()
    serializer_class = AdmissionMetaSerializer

    @action(detail=True, methods=['post'])
    def submit_full_form(self, request, pk=None):
        admission = self.get_object()
        data = request.data
        
        try:
            with transaction.atomic():
                # Handling nested Bio
                bio_data = data.get('student_bio')
                if bio_data:
                    # Sanitize numeric fields
                    if bio_data.get('age') == '': bio_data['age'] = 0
                    for field in ['height_cm', 'weight_kg']:
                        if bio_data.get(field) == '': bio_data[field] = None
                    StudentBio.objects.update_or_create(admission=admission, defaults=bio_data)

                # Handling Address
                address_data = data.get('address')
                if address_data:
                    StudentAddress.objects.update_or_create(admission=admission, defaults=address_data)

                # Handling Bank
                bank_data = data.get('bank_details')
                if bank_data:
                    StudentBankDetails.objects.update_or_create(admission=admission, defaults=bank_data)

                # Handling Previous Academic
                aca_data = data.get('previous_academic')
                if aca_data:
                    # Sanitize metrics
                    for f in ['marks_obtained', 'total_marks', 'percentage']:
                        if aca_data.get(f) == '': aca_data[f] = None
                    PreviousAcademic.objects.update_or_create(admission=admission, defaults=aca_data)

                # Handling Siblings (Delete existing and recreate)
                siblings_data = data.get('siblings', [])
                if siblings_data:
                    SiblingDetail.objects.filter(admission=admission).delete()
                    for sib in siblings_data:
                        if sib.get('age') == '': sib['age'] = None
                        SiblingDetail.objects.create(admission=admission, **sib)

                # Handling Parents (Delete existing and recreate)
                parents_data = data.get('parents_guardians', [])
                if parents_data:
                    ParentGuardianDetail.objects.filter(admission=admission).delete()
                    for p in parents_data:
                        # Sanitize is_single_parent if necessary
                        ParentGuardianDetail.objects.create(admission=admission, **p)

                # Handling Declaration
                dec_data = data.get('declaration')
                if dec_data:
                    Declaration.objects.update_or_create(admission=admission, defaults=dec_data)

                # Update Profile Step
                profile = admission.profile
                profile.admission_step = 3
                profile.save()

                return Response({'status': 'Full form submitted successfully'})
        except Exception as e:
            import traceback
            print(f"Submission Error: {str(e)}")
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer

    def get_queryset(self):
        # Students should only see/edit their own profile
        if self.request.user.role == 'STUDENT_PARENT':
            return StudentProfile.objects.filter(user=self.request.user)
        return super().get_queryset()

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        profile = StudentProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit_form(self, request, pk=None):
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(admission_step=2) # Advance to step 2 (Verification pending)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
