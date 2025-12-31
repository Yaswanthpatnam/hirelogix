from django.urls import path
from .views import (
    RegisterAPI,
    LoginAPI,
    LogoutAPI,
    ProfileAPI,
    ForgotPasswordAPI,
    ResetPasswordAPI,
)

urlpatterns = [
    path("register/", RegisterAPI.as_view()),
    path("login/", LoginAPI.as_view()),
    path("logout/", LogoutAPI.as_view()),
    path("profile/", ProfileAPI.as_view()),

    path("forgot-password/", ForgotPasswordAPI.as_view()),
    path("reset-password/", ResetPasswordAPI.as_view()),
]
