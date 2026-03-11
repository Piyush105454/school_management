from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InquiryViewSet, StudentProfileViewSet, AdmissionViewSet

router = DefaultRouter()
router.register(r'inquiries', InquiryViewSet)
router.register(r'profiles', StudentProfileViewSet)
router.register(r'admission', AdmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
