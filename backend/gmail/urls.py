from django.urls import path

from .incremental_views import (
    GmailIncrementalSyncAPI,
)

from .views import (
    GmailAuthStartAPI,
    GmailConnectionStatusAPI,
    GmailHistoricalSyncAPI,
    GmailMessageTestAPI,
    GmailMessagesTestAPI,
    GmailOAuthCallbackAPI,
    GmailTokenTestAPI,
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
        "token/test/",
        GmailTokenTestAPI.as_view(),
        name="gmail-token-test",
    ),

    path(
        "messages/test/",
        GmailMessagesTestAPI.as_view(),
        name="gmail-messages-test",
    ),

    path(
        "message/test/<str:message_id>/",
        GmailMessageTestAPI.as_view(),
        name="gmail-message-test",
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