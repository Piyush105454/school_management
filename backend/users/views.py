from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the JWT payload
        token['email'] = user.email
        token['role'] = user.role
        return token

    def validate(self, attrs):
        # The base validate() method uses USERNAME_FIELD (email) as the key in attrs
        data = super().validate(attrs)
        # Also include them in the response body for convenience
        data['role'] = self.user.role
        data['email'] = self.user.email
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
