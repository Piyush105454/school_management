from rest_framework import serializers
from .models import (
    Inquiry, AdmissionMeta, StudentBio, StudentAddress, 
    StudentBankDetails, PreviousAcademic, SiblingDetail, 
    ParentGuardianDetail, Declaration, DocumentChecklist, StudentProfile
)

class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = '__all__'

class StudentBioSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentBio
        fields = '__all__'
        extra_kwargs = {'admission': {'required': False}}

class StudentAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAddress
        fields = '__all__'
        extra_kwargs = {'admission': {'required': False}}

class StudentBankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentBankDetails
        fields = '__all__'
        extra_kwargs = {'admission': {'required': False}}

class PreviousAcademicSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreviousAcademic
        fields = '__all__'
        extra_kwargs = {'admission': {'required': False}}

class SiblingDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiblingDetail
        fields = '__all__'
        extra_kwargs = {'admission': {'required': False}}

class ParentGuardianDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentGuardianDetail
        fields = '__all__'
        extra_kwargs = {'admission': {'required': False}}

class DeclarationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Declaration
        fields = '__all__'
        extra_kwargs = {'admission': {'required': False}}

class DocumentChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChecklist
        fields = '__all__'
        extra_kwargs = {'admission': {'required': False}}

class AdmissionMetaSerializer(serializers.ModelSerializer):
    student_bio = StudentBioSerializer(required=False)
    address = StudentAddressSerializer(required=False)
    bank_details = StudentBankDetailsSerializer(required=False)
    previous_academic = PreviousAcademicSerializer(required=False)
    siblings = SiblingDetailSerializer(many=True, required=False)
    parents_guardians = ParentGuardianDetailSerializer(many=True, required=False)
    declaration = DeclarationSerializer(required=False)
    document_checklist = DocumentChecklistSerializer(required=False)

    class Meta:
        model = AdmissionMeta
        fields = '__all__'

class StudentProfileSerializer(serializers.ModelSerializer):
    admission_meta = AdmissionMetaSerializer(read_only=True)
    class Meta:
        model = StudentProfile
        fields = '__all__'
