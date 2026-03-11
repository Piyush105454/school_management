from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the JWT payload
        token['username'] = user.username
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        # Allow login via email or username
        username = attrs.get("username")
        password = attrs.get("password")

        if "@" in username:
            try:
                user = User.objects.get(email=username)
                attrs["username"] = user.username
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        # Also include them in the response body for convenience
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['email'] = self.user.email
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
