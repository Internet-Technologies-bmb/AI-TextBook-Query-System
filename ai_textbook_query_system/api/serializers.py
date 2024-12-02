from rest_framework import serializers
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.get('password', None)  # Use .get() instead of function call
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)  # Hash the password

        instance.save()
        return instance



class LoginUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'password']