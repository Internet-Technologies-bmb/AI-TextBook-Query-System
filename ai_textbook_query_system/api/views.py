from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.


from django.shortcuts import render
from rest_framework import generics, status
from .serializers import UserSerializer, LoginUserSerializer
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
            # Find user by email
            user = UserProfile.objects.get(email=email)
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('User not found!')

        # Check if the password matches
        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect password')

        # Create JWT payload
        payload = {
            'id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),  # Expiry of 1 hour
            'iat': datetime.datetime.utcnow()  # Issued at
        }

        # Create the JWT token
        token = jwt.encode(payload, 'secret', algorithm='HS256')

        # Return the response with the JWT token
        response = Response({
            'jwt': token
        })

        # Set the JWT token as a HttpOnly cookie for client-side security
        response.set_cookie(key='jwt', value=token, httponly=True)

        return response


class UserProfileView(APIView):
    def get(self, request):
        token = request.COOKIES.get('jwt')

        if not token:
            raise AuthenticationFailed('Unauthenticated!')

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Unauthenticated! The token has expired.')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Unauthenticated! Invalid token.')

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