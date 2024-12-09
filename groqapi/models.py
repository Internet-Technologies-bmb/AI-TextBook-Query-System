from django.db import models
# Create your models here.

class UploadedFile(models.Model):
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size = models.PositiveIntegerField(default=0)  # Default to 0 if not set
    file_type = models.CharField(max_length=100, default='unknown')  # Provide a default value
    status = models.CharField(max_length=20, default="Pending")

    def __str__(self):
        return self.file.name
