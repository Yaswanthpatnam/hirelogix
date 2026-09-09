from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .oauth_service import GmailOAuthService


class GmailService:

    @staticmethod
    def get_valid_access_token(
        connection,
    ):

        if not connection.is_active:

            raise ValueError(
                "Gmail connection is inactive."
            )


        if not connection.access_token:

            raise ValueError(
                "No Gmail access token found."
            )


        refresh_buffer = (
            timezone.now()
            + timedelta(
                minutes=2
            )
        )


        token_needs_refresh = (
            not connection.token_expires_at
            or connection.token_expires_at
            <= refresh_buffer
        )


        if not token_needs_refresh:

            return connection.access_token


        if not connection.refresh_token:

            raise ValueError(
                "Gmail access token has expired "
                "and no refresh token is available. "
                "Please reconnect Gmail."
            )


        try:

            token_data = (
                GmailOAuthService
                .refresh_access_token(
                    refresh_token=(
                        connection.refresh_token
                    ),

                    client_id=(
                        settings.GOOGLE_CLIENT_ID
                    ),

                    client_secret=(
                        settings.GOOGLE_CLIENT_SECRET
                    ),
                )
            )


        except Exception as exc:

            print(
                "GMAIL TOKEN REFRESH ERROR:",
                repr(exc)
            )


            raise ValueError(
                "Unable to refresh Gmail access. "
                "Please reconnect Gmail."
            ) from exc


        new_access_token = (
            token_data.get(
                "access_token"
            )
        )


        expires_in = (
            token_data.get(
                "expires_in"
            )
        )


        if not new_access_token:

            raise ValueError(
                "Google did not return a new "
                "access token."
            )


        connection.access_token = (
            new_access_token
        )


        if expires_in:

            connection.token_expires_at = (
                timezone.now()
                + timedelta(
                    seconds=int(
                        expires_in
                    )
                )
            )


        connection.save(
            update_fields=[
                "access_token",
                "token_expires_at",
            ]
        )


        return connection.access_token