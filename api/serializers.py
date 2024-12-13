from rest_framework import serializers
from .models import UserProfile, Chat, Message, Note, FileUpload
from rest_framework.exceptions import ValidationError




class MessageSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat', 'user', 'role', 'role_display', 'content', 'created_at', 'is_note', 'file']
        read_only_fields = ['chat', 'user', 'role', 'created_at', 'file']  # Prevent user from changing these fields

    def validate_is_note(self, value):
        # Only assistant messages can be marked as notes
        if value and self.initial_data.get('role') != 'assistant':
            raise serializers.ValidationError("Only AI responses can be marked as notes.")
        return value

    def create(self, validated_data):
        # Ensure the chat field is set from the context if not already in validated_data
        if 'chat' not in validated_data and 'chat' in self.context:
            validated_data['chat'] = self.context['chat']
        return super().create(validated_data)


# Note Serializer
class NoteSerializer(serializers.ModelSerializer):
    message = MessageSerializer()

    class Meta:
        model = Note
        fields = ['id', 'message', 'user', 'created_at', 'updated_at']

# Chat Serializer
# Updated Chat Serializer
class ChatSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)  # User associated with the chat
    messages = MessageSerializer(many=True, read_only=True)  # Nested Message serializer for messages in this chat

    class Meta:
        model = Chat
        fields = ['id', 'user', 'title', 'created_at', 'messages']  # Include messages in the fields
        read_only_fields = ['user', 'created_at']

    def validate_title(self, value):
        # Ensure that the title is not empty and not too long.
        if not value:
            raise serializers.ValidationError("Title cannot be blank")
        if len(value) > 255:
            raise serializers.ValidationError("Title cannot exceed 255 characters")
        return value

    def create(self, validated_data):
        # Automatically assign the user from the request context (assuming authenticated user)
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# User Serializer for individual User data
# Updated User Serializer
class UserSerializer(serializers.ModelSerializer):
    chats = ChatSerializer(many=True, read_only=True)  # Chats related to the user, including their messages

    class Meta:
        model = UserProfile
        fields = ['id', 'email', 'password', 'chats']  # Include chats (with messages) in the fields
        extra_kwargs = {
            'password': {'write_only': True}  # Ensuring password is write-only
        }

    def create(self, validated_data):
        password = validated_data.get('password', None)
        instance = self.Meta.model(**validated_data)
        if password:
            instance.set_password(password)  # Hash the password before saving
        instance.save()
        return instance





# Serializer for login
class LoginUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = UserProfile
        fields = ['email', 'password']  # Assuming the model uses email as the login field

# FileUpload Serializer
class FileUploadSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Nested User serializer (read-only)
    chat = ChatSerializer(read_only=True)  # Nested Chat serializer (read-only)

    class Meta:
        model = FileUpload
        fields = ['id', 'chat', 'user', 'file', 'uploaded_at']  # Assuming 'file' is the actual file field

    def create(self, validated_data):
        """If necessary, you can modify the logic here to set the user or chat."""
        validated_data['user'] = self.context['request'].user  # Automatically set the user to the logged-in user
        return super().create(validated_data)
