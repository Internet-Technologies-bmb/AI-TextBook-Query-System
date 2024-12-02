from django.contrib.auth.models import AbstractBaseUser
from django.db import models

class UserProfile(AbstractBaseUser):
    email = models.EmailField(unique=True)
    username = None
    password = models.CharField(max_length=255)

    # Additional methods, if any
    USERNAME_FIELD = 'email'  # or 'username', depending on your use case
    REQUIRED_FIELDS = []  # List of fields that are required (e.g., username)

    def __str__(self):
        return self.email