from django.contrib.auth.models import AbstractBaseUser
from django.db import models
from django.utils import timezone

class UserProfile(AbstractBaseUser):
    email = models.EmailField(unique=True)
    username = None
    password = models.CharField(max_length=255)

    # Additional methods, if any
    USERNAME_FIELD = 'email'  # or 'username', depending on your use case
    REQUIRED_FIELDS = []  # List of fields that are required (e.g., username)

    def __str__(self):
        return self.email
    

    

# Chat Model (Represents a chat conversation)
class Chat(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='chats')  # User who created the chat
    title = models.CharField(max_length=255, blank=True, null=True)  # Optional chat title
    created_at = models.DateTimeField(default=timezone.now)  # When the chat was created

    def __str__(self):
        return f"Chat with {self.user.email} at {self.created_at}"


# Message Model (Represents a message within a chat)
class Message(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'), # User messages
        ('assistant', 'Assistant'), # GROQ AI replies
    )

    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    is_note = models.BooleanField(default=False)
    file = models.FileField(upload_to='message_files/', null=True, blank=True)
    
    def __str__(self):
        return f"{self.role.capitalize()} message at {self.created_at}"



# Note Model (Marks a message as a "highlighted" note)
class Note(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)  # Link note to message
    created_at = models.DateTimeField(default=timezone.now)  # Add default here
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Note by {self.user.username} on {self.message.content[:20]}..."


# File Upload Model (Handles file uploads for interactions like summarization)
class FileUpload(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='files')  # Chat this file belongs to
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='uploaded_files')  # User who uploaded the file
    file = models.FileField(upload_to='chat_files/')  # File field to handle the file upload
    uploaded_at = models.DateTimeField(default=timezone.now)  # Timestamp when the file was uploaded

    def __str__(self):
        return f"File uploaded by {self.user.email} for chat {self.chat.id} at {self.uploaded_at}"