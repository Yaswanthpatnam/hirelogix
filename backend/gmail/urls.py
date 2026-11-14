from django.urls import path

from .views import (
    GmailAuthStartAPI,
    GmailConnectionStatusAPI,
    GmailHistoricalSyncAPI,
    GmailIncrementalSyncAPI,
    GmailOAuthCallbackAPI,
)

urlpatterns = [
    path(
        "auth/start/",
        GmailAuthStartAPI.as_view(),
        name="gmail-auth-start",
    ),
    path(
        "oauth/callback/",
        GmailOAuthCallbackAPI.as_view(),
        name="gmail-oauth-callback",
    ),
    path(
        "status/",
        GmailConnectionStatusAPI.as_view(),
        name="gmail-connection-status",
    ),
    path(
        "sync/historical/",
        GmailHistoricalSyncAPI.as_view(),
        name="gmail-historical-sync",
    ),
    path(
        "sync/incremental/",
        GmailIncrementalSyncAPI.as_view(),
        name="gmail-incremental-sync",
    ),
]
