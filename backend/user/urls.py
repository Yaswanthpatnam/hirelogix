from django.urls import path

from .views import (
    GoogleLoginAPI,
    ProfileAPI,
    LogoutAPI,
)


urlpatterns = [

    path(
        "auth/google/",
        GoogleLoginAPI.as_view(),
    ),

    path(
        "auth/me/",
        ProfileAPI.as_view(),
    ),

    path(
        "auth/logout/",
        LogoutAPI.as_view(),
    ),
]