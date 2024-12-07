from django.urls import path
from .views import *

urlpatterns = [
    path('view-all-users', UsersView.as_view()),
    path('register', Register.as_view()),
    path('login', Login.as_view()),
    path('logout', LogoutView.as_view()),
    path('get-user', UserProfileView.as_view(), name='get-user')
]
