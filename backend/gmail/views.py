import hashlib
import secrets
from datetime import date, timedelta

from django.conf import settings
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .gmail_parser import GmailMessageParser
from .gmail_service import GmailService
from .gmail_sync_service import GmailSyncService
from .models import (
    GmailConnection,
    GmailOAuthTransaction,
)
from .oauth_service import GmailOAuthService


class GmailAuthStartAPI(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):

        existing_connection = (
            GmailConnection.objects
            .filter(
                user=request.user,
                is_active=True,
            )
            .first()
        )

        if existing_connection:

            return Response(
                {
                    "already_connected": True,
                    "authorization_url": None,
                },
                status=status.HTTP_200_OK,
            )

        GmailOAuthTransaction.objects.filter(
            user=request.user,
            used=False,
        ).delete()

        state = secrets.token_urlsafe(
            32
        )

        state_hash = hashlib.sha256(
            state.encode()
        ).hexdigest()

        expires_at = (
            timezone.now()
            + timedelta(
                minutes=10
            )
        )

        GmailOAuthTransaction.objects.create(
            user=request.user,
            state_hash=state_hash,
            expires_at=expires_at,
        )

        authorization_url = (
            GmailOAuthService
            .get_authorization_url(
                client_id=(
                    settings.GOOGLE_CLIENT_ID
                ),
                redirect_uri=(
                    settings.GMAIL_GOOGLE_REDIRECT_URI
                ),
                state=state,
            )
        )

        return Response(
            {
                "already_connected": False,
                "authorization_url":
                    authorization_url,
            },
            status=status.HTTP_200_OK,
        )


class GmailOAuthCallbackAPI(APIView):

    authentication_classes = []

    permission_classes = [
        AllowAny
    ]

    def get(
        self,
        request,
    ):

        error = request.GET.get(
            "error"
        )

        if error:

            return HttpResponseRedirect(
                (
                    f"{settings.FRONTEND_URL}"
                    "/permission"
                    "?gmail_error=denied"
                )
            )

        code = request.GET.get(
            "code"
        )

        state = request.GET.get(
            "state"
        )

        if not code:

            return HttpResponseRedirect(
                (
                    f"{settings.FRONTEND_URL}"
                    "/permission"
                    "?gmail_error=missing_code"
                )
            )

        if not state:

            return HttpResponseRedirect(
                (
                    f"{settings.FRONTEND_URL}"
                    "/permission"
                    "?gmail_error=missing_state"
                )
            )

        state_hash = hashlib.sha256(
            state.encode()
        ).hexdigest()

        with transaction.atomic():

            oauth_transaction = (
                GmailOAuthTransaction.objects
                .select_for_update()
                .filter(
                    state_hash=state_hash,
                    used=False,
                    expires_at__gt=timezone.now(),
                )
                .first()
            )

            if not oauth_transaction:

                print(
                    "INVALID GMAIL OAUTH STATE:",
                    state_hash,
                )

                return HttpResponseRedirect(
                    (
                        f"{settings.FRONTEND_URL}"
                        "/permission"
                        "?gmail_error=expired"
                    )
                )

            user = oauth_transaction.user

            try:

                tokens = (
                    GmailOAuthService
                    .exchange_code_for_tokens(
                        code=code,
                        client_id=(
                            settings.GOOGLE_CLIENT_ID
                        ),
                        client_secret=(
                            settings.GOOGLE_CLIENT_SECRET
                        ),
                        redirect_uri=(
                            settings
                            .GMAIL_GOOGLE_REDIRECT_URI
                        ),
                    )
                )

                access_token = tokens.get(
                    "access_token"
                )

                refresh_token = tokens.get(
                    "refresh_token"
                )

                expires_in = tokens.get(
                    "expires_in"
                )

                scope = tokens.get(
                    "scope",
                    "",
                )

                if not access_token:

                    raise ValueError(
                        "Google did not return "
                        "an access token."
                    )

                account = (
                    GmailOAuthService
                    .get_google_account(
                        access_token
                    )
                )

                google_email = (
                    account.get(
                        "emailAddress"
                    )
                )

                if not google_email:

                    raise ValueError(
                        "Unable to determine "
                        "Gmail account."
                    )

                google_email = (
                    google_email.lower()
                )

                token_expires_at = None

                if expires_in:

                    token_expires_at = (
                        timezone.now()
                        + timedelta(
                            seconds=int(
                                expires_in
                            )
                        )
                    )

                existing_connection = (
                    GmailConnection.objects
                    .filter(
                        google_email=google_email
                    )
                    .exclude(
                        user=user
                    )
                    .first()
                )

                if existing_connection:

                    raise ValueError(
                        "This Google account is "
                        "already connected to another "
                        "HireLogix account."
                    )

                connection = (
                    GmailConnection.objects
                    .filter(
                        user=user
                    )
                    .first()
                )

                if connection is None:

                    GmailConnection.objects.create(
                        user=user,
                        google_email=google_email,
                        access_token=access_token,
                        refresh_token=refresh_token,
                        token_expires_at=(
                            token_expires_at
                        ),
                        scopes=scope,
                        is_active=True,
                    )

                else:

                    connection.google_email = (
                        google_email
                    )

                    connection.access_token = (
                        access_token
                    )

                    connection.token_expires_at = (
                        token_expires_at
                    )

                    connection.scopes = scope

                    connection.is_active = True

                    if refresh_token:

                        connection.refresh_token = (
                            refresh_token
                        )

                    connection.save()

                oauth_transaction.used = True

                oauth_transaction.save(
                    update_fields=[
                        "used"
                    ]
                )

            except Exception as exc:

                print(
                    "GMAIL OAUTH CALLBACK ERROR:",
                    repr(exc),
                )

                return HttpResponseRedirect(
                    (
                        f"{settings.FRONTEND_URL}"
                        "/permission"
                        "?gmail_error=connection_failed"
                    )
                )

        return HttpResponseRedirect(
            (
                f"{settings.FRONTEND_URL}"
                "/dashboard"
            )
        )


class GmailConnectionStatusAPI(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):

        connection = (
            GmailConnection.objects
            .filter(
                user=request.user
            )
            .first()
        )

        if not connection:

            return Response(
                {
                    "connected": False,
                    "historical_sync_completed":
                        False,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "connected":
                    bool(
                        connection.is_active
                    ),

                "google_email":
                    connection.google_email,

                "historical_sync_completed":
                    connection
                    .historical_sync_completed,

                "job_search_started_on":
                    (
                        str(
                            connection
                            .job_search_started_on
                        )
                        if connection
                        .job_search_started_on
                        else None
                    ),

                "last_sync_at":
                    (
                        connection.last_sync_at
                        if connection.last_sync_at
                        else None
                    ),
            },
            status=status.HTTP_200_OK,
        )


class GmailTokenTestAPI(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):

        connection = (
            GmailConnection.objects
            .filter(
                user=request.user,
                is_active=True,
            )
            .first()
        )

        if not connection:

            return Response(
                {
                    "error":
                        "No active Gmail connection found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:

            GmailService.get_valid_access_token(
                connection
            )

            return Response(
                {
                    "message":
                        "Valid Gmail access token "
                        "retrieved successfully."
                }
            )

        except Exception as exc:

            print(
                "GMAIL TOKEN TEST ERROR:",
                repr(exc),
            )

            return Response(
                {
                    "error":
                        str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class GmailMessagesTestAPI(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):

        connection = (
            GmailConnection.objects
            .filter(
                user=request.user,
                is_active=True,
            )
            .first()
        )

        if not connection:

            return Response(
                {
                    "error":
                        "No active Gmail connection found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:

            access_token = (
                GmailService
                .get_valid_access_token(
                    connection
                )
            )

            messages_data = (
                GmailOAuthService
                .list_messages(
                    access_token=access_token,
                    max_results=10,
                )
            )

            return Response(
                messages_data
            )

        except Exception as exc:

            print(
                "GMAIL MESSAGE LIST ERROR:",
                repr(exc),
            )

            return Response(
                {
                    "error":
                        "Unable to retrieve Gmail messages."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class GmailMessageTestAPI(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        message_id,
    ):

        connection = (
            GmailConnection.objects
            .filter(
                user=request.user,
                is_active=True,
            )
            .first()
        )

        if not connection:

            return Response(
                {
                    "error":
                        "No active Gmail connection found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:

            access_token = (
                GmailService
                .get_valid_access_token(
                    connection
                )
            )

            message = (
                GmailOAuthService
                .get_message(
                    access_token=access_token,
                    message_id=message_id,
                )
            )

            parsed_headers = (
                GmailMessageParser
                .get_headers(
                    message
                )
            )

            parsed_body = (
                GmailMessageParser
                .get_body(
                    message
                )
            )

            return Response(
                {
                    "id":
                        message.get("id"),

                    "thread_id":
                        message.get("threadId"),

                    "from":
                        parsed_headers.get(
                            "from"
                        ),

                    "subject":
                        parsed_headers.get(
                            "subject"
                        ),

                    "date":
                        parsed_headers.get(
                            "date"
                        ),

                    "body":
                        parsed_body,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as exc:

            print(
                "GMAIL MESSAGE TEST ERROR:",
                repr(exc),
            )

            return Response(
                {
                    "error":
                        "Unable to retrieve Gmail message."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class GmailHistoricalSyncAPI(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):

        connection = (
            GmailConnection.objects
            .filter(
                user=request.user,
                is_active=True,
            )
            .first()
        )

        if not connection:

            return Response(
                {
                    "error":
                        "No active Gmail connection found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        submitted_date = (
            request.data.get(
                "job_search_started_on"
            )
        )

        if submitted_date:

            try:

                parsed_start_date = (
                    date.fromisoformat(
                        submitted_date
                    )
                )

            except ValueError:

                return Response(
                    {
                        "error":
                            "job_search_started_on "
                            "must use YYYY-MM-DD format."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                parsed_start_date
                > timezone.localdate()
            ):

                return Response(
                    {
                        "error":
                            "job_search_started_on "
                            "cannot be in the future."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            connection.job_search_started_on = (
                parsed_start_date
            )

            connection.save(
                update_fields=[
                    "job_search_started_on"
                ]
            )

        if not connection.job_search_started_on:

            return Response(
                {
                    "error":
                        "Provide job_search_started_on "
                        "before the first Gmail sync."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            sync_result = (
                GmailSyncService
                .sync_historical_job_emails(
                    connection
                )
            )

            return Response(
                {
                    "message":
                        "Historical Gmail job-email "
                        "sync completed successfully.",

                    "job_search_started_on":
                        str(
                            connection
                            .job_search_started_on
                        ),

                    **sync_result,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as exc:

            print(
                "GMAIL HISTORICAL SYNC ERROR:",
                repr(exc),
            )

            return Response(
                {
                    "error":
                        "Unable to complete "
                        "historical Gmail sync."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )