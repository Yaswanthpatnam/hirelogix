from urllib.parse import urlencode

import requests


class GmailOAuthService:

    AUTHORIZATION_URL = (
        "https://accounts.google.com/o/oauth2/v2/auth"
    )

    TOKEN_URL = (
        "https://oauth2.googleapis.com/token"
    )

    GMAIL_PROFILE_URL = (
        "https://gmail.googleapis.com/"
        "gmail/v1/users/me/profile"
    )

    GMAIL_MESSAGES_URL = (
        "https://gmail.googleapis.com/"
        "gmail/v1/users/me/messages"
    )

    GMAIL_HISTORY_URL = (
        "https://gmail.googleapis.com/"
        "gmail/v1/users/me/history"
    )

    SCOPES = [
        "https://www.googleapis.com/auth/gmail.readonly"
    ]

    @classmethod
    def get_authorization_url(
        cls,
        client_id,
        redirect_uri,
        state,
    ):
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(cls.SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }

        return (
            f"{cls.AUTHORIZATION_URL}?"
            f"{urlencode(params)}"
        )

    @classmethod
    def exchange_code_for_tokens(
        cls,
        code,
        client_id,
        client_secret,
        redirect_uri,
    ):
        response = requests.post(
            cls.TOKEN_URL,
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )

        response.raise_for_status()

        return response.json()

    @classmethod
    def refresh_access_token(
        cls,
        refresh_token,
        client_id,
        client_secret,
    ):
        response = requests.post(
            cls.TOKEN_URL,
            data={
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "refresh_token",
            },
            timeout=15,
        )

        response.raise_for_status()

        return response.json()

    @classmethod
    def get_google_account(
        cls,
        access_token,
    ):
        response = requests.get(
            cls.GMAIL_PROFILE_URL,
            headers={
                "Authorization":
                    f"Bearer {access_token}"
            },
            timeout=15,
        )

        response.raise_for_status()

        return response.json()

    @classmethod
    def list_messages(
        cls,
        access_token,
        query=None,
        max_results=100,
        page_token=None,
    ):
        params = {
            "maxResults": max_results,
        }

        if query:
            params["q"] = query

        if page_token:
            params["pageToken"] = page_token

        response = requests.get(
            cls.GMAIL_MESSAGES_URL,
            headers={
                "Authorization":
                    f"Bearer {access_token}"
            },
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        return response.json()

    @classmethod
    def get_message(
        cls,
        access_token,
        message_id,
        message_format="full",
        metadata_headers=None,
    ):
        message_url = (
            f"{cls.GMAIL_MESSAGES_URL}/"
            f"{message_id}"
        )

        params = [
            (
                "format",
                message_format,
            )
        ]

        if metadata_headers:

            for header_name in metadata_headers:

                params.append(
                    (
                        "metadataHeaders",
                        header_name,
                    )
                )

        response = requests.get(
            message_url,
            headers={
                "Authorization":
                    f"Bearer {access_token}"
            },
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        return response.json()

    @classmethod
    def list_history(
        cls,
        access_token,
        start_history_id,
        max_results=5,
        page_token=None,
    ):
        params = [
            (
                "startHistoryId",
                start_history_id,
            ),
            (
                "maxResults",
                max_results,
            ),
            (
                "historyTypes",
                "messageAdded",
            ),
        ]

        if page_token:

            params.append(
                (
                    "pageToken",
                    page_token,
                )
            )

        response = requests.get(
            cls.GMAIL_HISTORY_URL,
            headers={
                "Authorization":
                    f"Bearer {access_token}"
            },
            params=params,
            timeout=15,
        )

        response.raise_for_status()

        return response.json()