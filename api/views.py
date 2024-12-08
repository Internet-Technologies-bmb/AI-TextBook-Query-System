from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.
from rest_framework.exceptions import NotFound
from django.conf import settings
from django.shortcuts import render
from rest_framework import generics, status
from .serializers import *
from .utils import *
from .models import UserProfile
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password  # For hashing passwords
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed
from rest_framework.permissions import AllowAny
import jwt, datetime
from django.views.decorators.csrf import csrf_exempt


class UsersView(generics.ListAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserSerializer


class Register(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({
            'error': 'Invalid data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class Login(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = UserProfile.objects.get(email=email)
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('User not found!')

        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect password')

        payload = {
            'id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            'iat': datetime.datetime.utcnow()
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256')
        token_str = token if isinstance(token, str) else token.decode('utf-8')

        response = Response({'jwt': token_str})
        response.set_cookie(key='jwt', value=token_str, httponly=True)
        return response


class UserProfileView(APIView):
    authentication_classes = [CustomJWTAuthentication]  # Use the custom authentication class
    def get(self, request):
        # Use the utility function to get the payload
        payload = get_jwt_token(request)

        try:
            user = UserProfile.objects.get(id=payload['id'])
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('User not found.')

        # Serialize and return the user data
        serializer = UserSerializer(user)
        return Response(serializer.data)


class LogoutView(APIView):
    def post(self, request):
        response = Response()
        response.delete_cookie('jwt')  # This removes the JWT cookie
        response.data = {
            'message': 'Logged out successfully'
        }
        return response
    



class CreateChatAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]  # Use the custom authentication class

    def post(self, request):
        # Extract the title from the request data
        title = request.data.get('title', None)

        if not title:
            return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get the user from the JWT token (using the utility function)
        payload = get_jwt_token(request)
        user = UserProfile.objects.get(id=payload['id'])

        # Create the chat object
        chat = Chat.objects.create(user=user, title=title)

        # Serialize the created chat and return the response
        chat_data = ChatSerializer(chat).data
        return Response(chat_data, status=status.HTTP_201_CREATED)
    
class GetChatAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]  # Use the custom authentication class

    def get(self, request, chat_id):
        try:
            # Get the user from the JWT token (using the utility function)
            payload = get_jwt_token(request)
            user = UserProfile.objects.get(id=payload['id'])

            # Fetch the chat by its ID, ensuring it belongs to the authenticated user
            chat = Chat.objects.filter(id=chat_id, user=user).first()

            if not chat:
                return Response({'error': 'Chat not found or not accessible'}, status=status.HTTP_404_NOT_FOUND)

            # Serialize the chat data and return it
            chat_data = ChatSerializer(chat).data
            return Response(chat_data, status=status.HTTP_200_OK)

        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DeleteChatAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]  # Use the custom authentication class

    def delete(self, request, chat_id):
        try:
            # Extract the user from the JWT token
            payload = get_jwt_token(request)
            user = UserProfile.objects.get(id=payload['id'])

            # Retrieve the chat object by ID
            chat = Chat.objects.get(id=chat_id)

            # Check if the user is the owner of the chat
            if chat.user != user:
                return Response({'error': 'You are not authorized to delete this chat.'},
                                status=status.HTTP_403_FORBIDDEN)

            # Delete the chat object
            chat.delete()

            # Return success response
            return Response({'message': 'Chat deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

        except Chat.DoesNotExist:
            return Response({'error': 'Chat not found.'}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        


class CreateMessageAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]  # Use the custom authentication class

    def post(self, request, chat_id):
        # Ensure the chat exists
        try:
            chat = Chat.objects.get(id=chat_id)
        except Chat.DoesNotExist:
            raise NotFound(f"Chat with ID {chat_id} does not exist.")

        # Validate that the user is the one associated with the chat
        if chat.user != request.user:
            return Response(
                {'detail': 'You do not have permission to send messages in this chat.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Prepare the data to create a message
        data = {
            'chat': chat.id,
            'user': request.user.id,
            'role': request.data.get('role', 'user'),  # Default to 'user' role
            'content': request.data.get('content', ''),
            'is_note': request.data.get('is_note', False),
            # Use request.FILES.get('file') for file data
            'file': request.FILES.get('file', None),
        }

        # Serialize the message data
        serializer = MessageSerializer(data=data)

        if serializer.is_valid():
            serializer.save()  # Save the new message to the database
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # If serializer is not valid, return validation errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Example Django view to fetch chat messages
class GetChatMessagesAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]  # Use the custom authentication class

    def get(self, request, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id)
            messages = chat.messages.all()  # Assuming a reverse relation on 'Chat' model
            message_data = MessageSerializer(messages, many=True).data
            return Response({"messages": message_data})
        except Chat.DoesNotExist:
            return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)


class GetChatsAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]

    def get(self, request):
        # Get the user from the JWT token
        payload = get_jwt_token(request)
        user = UserProfile.objects.get(id=payload['id'])

        # Fetch all chats for the user
        chats = Chat.objects.filter(user=user)
        
        # Serialize and return the chats
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)