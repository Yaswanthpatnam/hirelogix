from rest_framework import serializers
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import re
from .models import User


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_username(self, username):
        if not re.match(r"^[a-z0-9_]+$", username):
            raise serializers.ValidationError(
                "Username must contain lowercase letters, numbers, or underscores only."
            )
        if User.objects.filter(username=username.lower()).exists():
            raise serializers.ValidationError("Username already exists.")
        return username.lower()

    def validate_email(self, email):
        try:
            validate_email(email)
        except ValidationError:
            raise serializers.ValidationError("Invalid email format")

        if User.objects.filter(email=email.lower()).exists():
            raise serializers.ValidationError("Email already registered.")
        return email.lower()

    def validate_password(self, password):
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#%*?&]).{8,}$'
        if not re.match(pattern, password):
            raise serializers.ValidationError(
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            )
        return password

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)



class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        if not User.objects.filter(email=email.lower()).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return email.lower()



class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_password(self, password):
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!#%*?&]).{8,}$'
        if not re.match(pattern, password):
            raise serializers.ValidationError(
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            )
        return password

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data