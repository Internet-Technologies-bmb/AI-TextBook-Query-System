from rest_framework import serializers
from .models import UserProfile, Chat, Message, Note, FileUpload
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


        
class ChatSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Chat
        fields = ['id', 'user', 'title', 'created_at']
        read_only_fields = ['user', 'created_at']

        def validate_title(self, value):
            if not value and ((len(value) > 255)):
                raise serializers.ValidationError("Title cannot be blank or more than 255 characters")
            return value
        
        def create(self, validated_data):
            validated_data['user'] = self.context['request'].user
            return super().create(validated_data)


class MessageSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True) # Get the display value of the role

    class Meta:
        model = Message
        fields = ['id', 'chat', 'user', 'role', 'role_display', 'content', 'created_at', 'is_note', 'file']


class NoteSerializer(serializers.ModelSerializer):
    message = MessageSerializer(read_only=True)
    class Meta:
        model = Note
        fields = ['id', 'message', 'highlighted_at']


class FileUploadSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    chat = ChatSerializer(read_only=True)
    class Meta:
        model = FileUpload
        fields = ['id', 'chat', 'user', 'file', 'uploaded_at']




        