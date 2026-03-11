import random
import string
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Inquiry, StudentProfile
from .serializers import InquirySerializer

User = get_user_model()

class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all().order_by('-created_at')
    serializer_class = InquirySerializer

    @action(detail=True, methods=['post'])
    def shortlist(self, request, pk=None):
        inquiry = self.get_object()
        
        if inquiry.status == 'SHORTLISTED':
            return Response({'error': 'Already shortlisted'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Generate Entry Number (e.g., INQ-2025-XXXX)
        year = inquiry.academic_year or '2025'
        random_bits = ''.join(random.choices(string.digits, k=4))
        entry_number = f"INQ-{year}-{random_bits}"
        
        # 2. Create User
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        user = User.objects.create_user(
            username=entry_number,
            email=inquiry.email,
            password=password,
            role=User.STUDENT_PARENT
        )
        
        # 3. Create Student Profile
        StudentProfile.objects.create(
            user=user,
            inquiry=inquiry
        )
        
        # 4. Update Inquiry
        inquiry.status = 'SHORTLISTED'
        inquiry.entry_number = entry_number
        inquiry.save()

        # 5. Mock Email Logic
        print(f"\n[EMAIL MOCK] To: {inquiry.email}")
        print(f"Subject: Admission Inquiry Selected - {inquiry.student_name}")
        print(f"Body: Your inquiry has been shortlisted! \nLogin to the portal at http://localhost:5173/student-login \nUsername: {entry_number} \nPassword: {password}\n")

        return Response({
            'message': 'Student shortlisted and credentials generated',
            'entry_number': entry_number,
            'password': password # In a real app, don't return the raw password in API
        })

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
