from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from .serilizers import (
      RegisterUserSerilizer , LoginSerializer 
        ,EmailVerifySerilizer ,OtpVerifySerializer, SetRoleSerializer, reset_password_serializer, ProfileSerializer,
        ProfileImageUploadSerializer, CoverImageUploadSerializer, UserTagSerializer
      )
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login , logout , get_user_model
import random
from .models import Otp, Tag
from .services import send_OTP_To_Email
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
import requests
from django.contrib.auth import get_user_model
from django.middleware.csrf import get_token
from django.db import IntegrityError, OperationalError



import os
from dotenv import load_dotenv

load_dotenv()


User = get_user_model()


def _needs_profile_completion(user):
    # Respect explicit completion state set by the profile/role flow.
    if getattr(user, "profile_completed", False):
        return False

    # Role is mandatory for all users.
    if not getattr(user, "role", None):
        return True

    # For email/password users keep strict name requirement.
    if getattr(user, "login_method", None) == User.LoginMethod.EMAIL:
        return not bool(getattr(user, "first_name", None) and getattr(user, "last_name", None))

    # OAuth users may not provide names reliably; role is enough.
    return False

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # To bypass CSRF check


@method_decorator(csrf_exempt,name='dispatch')   
class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = UserTagSerializer
    permission_classes = [AllowAny]


class RegisterView(APIView):
      permission_classes = [AllowAny]
      authentication_classes = [] 
      def post(self, request):
            serilizer = RegisterUserSerilizer(data=request.data)
            if serilizer.is_valid():
                user = serilizer.save()
                login(request,user)
                  
                csrf_token = get_token(request)
                needs_profile_completion = _needs_profile_completion(user)
                return Response({
                        "message": "User registered and logged in successfully",
                        "user": user.id,            
                        "email": user.email,
                        "username": user.username,
                        "firstName": user.first_name,
                        "lastName": user.last_name, 
                        "role": getattr(user, "role", None),
                    "profile_completed": not needs_profile_completion,
                    "next": "/complete-profile" if needs_profile_completion else "/",
                        "csrftoken": csrf_token
                    }, status=status.HTTP_201_CREATED)
            return Response(serilizer.errors,status=400)
      
@method_decorator(csrf_exempt,name='dispatch')    
class LoginView(APIView):
      permission_classes = [AllowAny]
      authentication_classes = []

      def post(self,request):
            serializer = LoginSerializer(data=request.data)
            if not serializer.is_valid():
                  return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            user = serializer.validated_data["user"]
            login(request,user)
            needs_profile_completion = _needs_profile_completion(user)

            response = Response({
                "user" : user.id,
                "email" : user.email,
                "username" : user.username,
                "firstName" : user.first_name,
                "lastName" : user.last_name,
                "profile_completed": not needs_profile_completion,
                "next": "/complete-profile" if needs_profile_completion else "/",
            },status=status.HTTP_200_OK)
            # expose role to frontend via cookie for middleware-based redirects
            if not needs_profile_completion:
                response.set_cookie("role", user.role, max_age=60 * 60 * 24)
            return response

class LogoutView(APIView):
      permission_classes = [IsAuthenticated]
      def post(self,request):
            logout(request)
            return Response({"message": "Logout successful"})
      
@method_decorator(csrf_exempt,name='dispatch')    
class EmailVerificationView(APIView):
      permission_classes = [AllowAny]
      def post(self,request):
            serializer = EmailVerifySerilizer(data=request.data)
            if serializer.is_valid():
                  email = serializer.validated_data['email']
                  OTP_CODE = random.randint(100000,999999)
                  Otp.objects.create(
                        email = email,
                        code = OTP_CODE
                  )
                  send_OTP_To_Email(
                        subject="otp code for password cahange",
                        email=email,
                        message=f'your one time password is {OTP_CODE}'
                  )
                  return Response(
                        {"message" : "OTP sent successfuly."}
                        , status=status.HTTP_200_OK
                  )
            return Response(serializer.errors, status=500)
            
@method_decorator(csrf_exempt, name='dispatch')            
class OTPVerifyVIew(APIView):
      permission_classes = [AllowAny]
      def post(self,request):
            serializer = OtpVerifySerializer(data=request.data)
            if serializer.is_valid():
               result = serializer.save()
               return Response({
                  "message": "OTP verified",
            }, status=status.HTTP_201_CREATED)
          
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
      
@method_decorator(csrf_exempt, name='dispatch')      
class NewPasswordChangeView(APIView):
      permission_classes = [AllowAny]
      def post(self,request):
            serializer = reset_password_serializer(data=request.data)
            if serializer.is_valid():
               result = serializer.save()
               return Response(result, status=status.HTTP_200_OK)
          
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class GoogleLoginAPIView(APIView):
    permission_classes =[]
    authentication_classes =[]
    def post(self, request):
        id_token_str = request.data.get("id_token")
        if not id_token_str:
            return Response(
                {"error": "Missing id_token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        google_client_id = settings.GOOGLE_CLIENT_ID or os.environ.get("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
        if not google_client_id:
            return Response(
                {"error": "Google OAuth is not configured on server"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                google_client_id
            )
        except ValueError as e:
            return Response(
                {"error": "Invalid token", "details": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {"error": "Could not verify Google token", "details": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            if idinfo.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                return Response(
                    {"error": "Invalid issuer"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            email = idinfo.get("email")
            if not email:
                return Response(
                    {"error": "Email not provided by Google"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            google_sub = idinfo.get("sub")
            if not google_sub:
                return Response(
                    {"error": "Google subject (sub) not provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")

            try:
                user, created = self.get_or_create_user(
                    email=email,
                    google_sub=google_sub,
                    first_name=first_name,
                    last_name=last_name
                )
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except OperationalError:
                return Response(
                    {
                        "error": "Database unavailable",
                        "details": "Could not connect to the database. Check PostgreSQL service and DATABASE_URL.",
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            login(request, user)
            needs_profile_completion = _needs_profile_completion(user)

            response = Response({
                "status": "success",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                },
                "created": created,
                "profile_completed": not needs_profile_completion,
            })
            if not needs_profile_completion:
                response.set_cookie("role", user.role, max_age=60 * 60 * 24)
            return response

        except OperationalError:
            return Response(
                {
                    "error": "Database unavailable",
                    "details": "Could not connect to the database. Check PostgreSQL service and DATABASE_URL.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            return Response(
                {"error": "Authentication failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_or_create_user(self, email, google_sub, first_name, last_name):
        User = get_user_model()

        user = User.objects.filter(google_id=google_sub).first()
        if user:
            user.login_method = User.LoginMethod.GOOGLE
            user.is_google_account = True
            if not user.first_name and first_name:
                user.first_name = first_name
            if not user.last_name and last_name:
                user.last_name = last_name
            user.save()
            return user, False

        existing_email_user = User.objects.filter(email=email).first()
        if existing_email_user:
            provider = getattr(existing_email_user, 'login_method', 'Email/GitHub')
            raise ValueError(
                f"An account with this email already exists using {provider}. "
                "Please log in with that provider."
            )

        try:
            username = self.generate_unique_username(email)
            user = User.objects.create_user(
                username=username,
                email=email,
                google_id=google_sub,
                is_google_account=True,
                login_method=User.LoginMethod.GOOGLE,
                first_name=first_name,
                last_name=last_name,
            )
            return user, True
        except IntegrityError:
            raise ValueError("Error creating account. Username or Email collision.")

    def generate_unique_username(self, email):
        base_username = email.split('@')[0]
        username = base_username
        User = get_user_model()
        
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        return username

@method_decorator(csrf_exempt, name='dispatch')
class GithubLoginAPIView(APIView):
    permission_classes = []
    authentication_classes = []

    def generate_unique_username(self, email):
        base_username = email.split('@')[0]
        username = base_username
        User = get_user_model()
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        return username

    def get_or_create_user(self, email, github_id, first_name, last_name, github_login):
        User = get_user_model()

        user = User.objects.filter(github_id=github_id).first()
        if user:
            return user, False

        existing_email_user = User.objects.filter(email=email).first()
        if existing_email_user:
            provider = getattr(existing_email_user, 'login_method', 'Email/Google')
            raise ValueError(
                f"An account with this email already exists using {provider}. "
                "Please log in with that provider."
            )

        try:
            username = self.generate_unique_username(email)
            user = User.objects.create_user(
                username=username,
                email=email,
                github_id=github_id,
                is_github_account=True,
                login_method=User.LoginMethod.GITHUB,
                first_name=first_name,
                last_name=last_name,
            )
            return user, True
        except IntegrityError:
            raise ValueError("Error creating account. Username or Email collision.")

    def post(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"error": "Missing GitHub code"}, status=400)

        client_id = os.environ.get("GITHUB_CLIENT_ID")
        client_secret = os.environ.get("GITHUB_CLIENT_SECRET")
        if not client_id or not client_secret:
            return Response({"error": "GitHub OAuth is not configured"}, status=500)

        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
            },
            timeout=10,
        )

        if token_response.status_code != 200:
            return Response({"error": "GitHub token exchange failed"}, status=400)

        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return Response({"error": "GitHub token exchange failed"}, status=400)

        user_response = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"},
            timeout=10,
        )

        if user_response.status_code != 200:
            return Response({"error": "Could not fetch GitHub user profile"}, status=400)

        user_data = user_response.json()

        email_res = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"token {access_token}"},
            timeout=10,
        )

        if email_res.status_code != 200:
            return Response({"error": "Could not fetch GitHub emails"}, status=400)

        emails = email_res.json()
        email = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)

        if not email:
            return Response({"error": "Could not fetch verified GitHub email"}, status=400)

        github_id = str(user_data["id"])
        full_name = (user_data.get("name") or "").strip()
        first_name = full_name.split(" ")[0] if full_name else ""
        last_name = " ".join(full_name.split(" ")[1:]) if full_name and len(full_name.split(" ")) > 1 else ""

        try:
            user, created = self.get_or_create_user(
                email=email,
                github_id=github_id,
                first_name=first_name,
                last_name=last_name,
                github_login=user_data.get("login", ""),
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)
        needs_profile_completion = _needs_profile_completion(user)
        must_complete_profile = needs_profile_completion
        response = Response({
            "status": "success",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
            "created": created,
            "profile_completed": not must_complete_profile,
            "next": "/complete-profile" if must_complete_profile else "/",
        }, status=status.HTTP_200_OK)
        if not must_complete_profile:
            response.set_cookie("role", user.role, max_age=60 * 60 * 24)
        return response
        
        
@method_decorator(csrf_exempt, name='dispatch')
class SetUserRoleView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication] 
    
    def post(self, request):
        serializer = SetRoleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        role = serializer.validated_data['role']

        user = request.user
        user.role = role
        user.profile_completed = True
        user.save()

        response = Response(
            {"message": "User role updated successfully", "role": user.role},
            status=status.HTTP_200_OK,
        )
        response.set_cookie("role", user.role, max_age=60 * 60 * 24)
        return response
    

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
   
    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = ProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileImageUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProfileImageUploadSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        request.user.refresh_from_db()
        response_serializer = ProfileImageUploadSerializer(request.user)
        return Response(
            {
                "message": "Profile image uploaded successfully",
                "profile_image": response_serializer.data.get("profile_image"),
                "profile_image_public_id": response_serializer.data.get("profile_image_public_id"),
                "profile_image_url": response_serializer.data.get("profile_image_url"),
            },
            status=status.HTTP_200_OK,
        )


class CoverImageUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CoverImageUploadSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        request.user.refresh_from_db()
        response_serializer = CoverImageUploadSerializer(request.user)
        return Response(
            {
                "message": "Cover image uploaded successfully",
                "cover_image": response_serializer.data.get("cover_image"),
                "cover_image_public_id": response_serializer.data.get("cover_image_public_id"),
                "cover_image_url": response_serializer.data.get("cover_image_url"),
            },
            status=status.HTTP_200_OK,
        )

