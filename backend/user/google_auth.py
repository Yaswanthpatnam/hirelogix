from google.auth.transport import requests
from google.oauth2 import id_token


class GoogleAuthenticationError(Exception):
    pass


class GoogleAuthService:

    @staticmethod
    def verify_credential(
        credential,
        client_id,
    ):

        if not credential:

            raise GoogleAuthenticationError(
                "Google credential was not provided."
            )


        if not client_id:

            raise GoogleAuthenticationError(
                "Google Client ID is not configured."
            )


        try:

            google_user = (
                id_token.verify_oauth2_token(
                    credential,
                    requests.Request(),
                    client_id,
                    clock_skew_in_seconds=10,
                )
            )


        except ValueError as exc:

            print(
                "GOOGLE TOKEN VERIFICATION ERROR:",
                repr(exc),
            )

            raise GoogleAuthenticationError(
                f"Invalid Google credential: {exc}"
            ) from exc


        issuer = google_user.get(
            "iss"
        )


        if issuer not in (
            "accounts.google.com",
            "https://accounts.google.com",
        ):

            raise GoogleAuthenticationError(
                "Invalid Google token issuer."
            )


        audience = google_user.get(
            "aud"
        )


        if audience != client_id:

            print(
                "GOOGLE AUDIENCE:",
                audience,
            )

            print(
                "EXPECTED CLIENT ID:",
                client_id,
            )

            raise GoogleAuthenticationError(
                "Google credential was issued for "
                "a different Client ID."
            )


        email = google_user.get(
            "email"
        )


        if not email:

            raise GoogleAuthenticationError(
                "Google account has no email."
            )


        if not google_user.get(
            "email_verified",
            False,
        ):

            raise GoogleAuthenticationError(
                "Google email is not verified."
            )


        google_id = google_user.get(
            "sub"
        )


        if not google_id:

            raise GoogleAuthenticationError(
                "Google account ID was not provided."
            )


        return {

            "google_id":
                google_id,

            "email":
                email,

            "first_name":
                google_user.get(
                    "given_name",
                    ""
                ),

            "last_name":
                google_user.get(
                    "family_name",
                    ""
                ),

            "profile_picture":
                google_user.get(
                    "picture"
                ),
        }