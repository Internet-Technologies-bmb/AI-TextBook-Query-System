import jwt
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from .models import UserProfile

def get_jwt_token(request):
    """
    Utility function to extract and decode the JWT from the request's cookies.
    """
    token = request.COOKIES.get('jwt')  # Get the token from cookies
    
    if not token:
        raise AuthenticationFailed('Unauthenticated! Token missing.')

    try:
        payload = jwt.decode(token, 'secret', algorithms=['HS256'])  # Use your secret key here
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token has expired.')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token.')

    return payload





class CustomJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get('jwt')  # Or get it from headers if needed

        if not token:
            raise AuthenticationFailed('Token missing')

        try:
            # Decode the token
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
            user = UserProfile.objects.get(id=payload['id'])
            return (user, None)  # Return user and None for authentication
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('User not found')
        
        