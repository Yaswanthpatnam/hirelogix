from django.contrib import admin
from django.urls import include, path

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)


urlpatterns = [

    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "user/",
        include("user.urls"),
    ),

    path(
        "jobs/",
        include("jobs.urls"),
    ),

    path(
        "gmail/",
        include("gmail.urls"),
    ),

    path(
        "auth/token/refresh/",
        TokenRefreshView.as_view(),
    ),
]