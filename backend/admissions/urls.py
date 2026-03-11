from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InquiryViewSet, StudentProfileViewSet

router = DefaultRouter()
router.register(r'inquiries', InquiryViewSet)
router.register(r'profiles', StudentProfileViewSet)
urlpatterns = [
    path('', include(router.urls)),
]
