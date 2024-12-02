# frontend/urls.py

from django.urls import path
from .views import index

app_name = 'frontend'

urlpatterns = [
    path('', index, name='index'),  # Root URL (i.e., http://127.0.0.1:8000/)
    path('home', index, name='home'),  # Optional additional URL for home (i.e., http://127.0.0.1:8000/home)
]
