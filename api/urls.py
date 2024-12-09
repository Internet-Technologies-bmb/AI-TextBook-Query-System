from django.urls import path
from .views import *

urlpatterns = [
    path('view-all-users', UsersView.as_view()),
    path('register', Register.as_view()),
    path('login', Login.as_view()),
    path('logout', LogoutView.as_view()),
    path('get-user', UserProfileView.as_view(), name='get-user'),
    path('create-chat', CreateChatAPIView.as_view(), name= 'create-chat'),
    path('delete-chat/<int:chat_id>', DeleteChatAPIView.as_view(), name='delete-chat'),
    path('chat/<int:chat_id>', GetChatAPIView.as_view(), name='get-chat'),
    path('chat/<int:chat_id>/messages', GetChatMessagesAPIView.as_view(), name='get-messages-from-chat'),
    path('get-all-chats', GetChatsAPIView.as_view(), name='get-chats'),
    path('create-message/<int:chat_id>/', CreateMessageAPIView.as_view(), name='create-message'),
]