from django.urls import path
from .views import( LoginView , RegisterView ,LogoutView , EmailVerificationView , OTPVerifyVIew , NewPasswordChangeView ,
                   GoogleLoginAPIView, GithubLoginAPIView , SetUserRoleView, ProfileView,
                   ProfileImageUploadView, CoverImageUploadView, TagListView
)
urlpatterns = [
    path("tags/", TagListView.as_view(), name="tag-list"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/email/", EmailVerificationView.as_view(), name="email-verify"),
    path("auth/otp-verify/", OTPVerifyVIew.as_view(), name="verify-otp"),
    path('auth/new-password/' , NewPasswordChangeView.as_view(), name="new-password"),
    path("auth/google/", GoogleLoginAPIView.as_view(), name="google-login"),
    path("auth/github/", GithubLoginAPIView.as_view(), name="github-login"),
    path("auth/set-role/", SetUserRoleView.as_view(), name="set-role"),
    path("auth/me/", ProfileView.as_view(), name="current-user"),
    path("auth/profile-image/", ProfileImageUploadView.as_view(), name="profile-image-upload"),
    path("auth/cover-image/", CoverImageUploadView.as_view(), name="cover-image-upload"),
]