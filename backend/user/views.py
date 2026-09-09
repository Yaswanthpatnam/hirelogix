from django.conf import settings

from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import (
    RefreshToken,
)

from .google_auth import (
    GoogleAuthService,
    GoogleAuthenticationError,
)

from .models import User

from .serializers import (
    GoogleLoginSerializer,
)


class GoogleLoginAPI(APIView):

    permission_classes = [
        AllowAny
    ]

    authentication_classes = []

    def post(
        self,
        request
    ):

        serializer = GoogleLoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        credential = serializer.validated_data[
            "credential"
        ]


        try:

            google_user = (
                GoogleAuthService
                .verify_credential(
                    credential,
                    settings.GOOGLE_CLIENT_ID,
                )
            )

        except GoogleAuthenticationError as exc:

            print(
                "GOOGLE AUTH ERROR:",
                str(exc)
            )

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )


        email = google_user[
            "email"
        ]

        google_id = google_user[
            "google_id"
        ]


        user = User.objects.filter(
            email=email
        ).first()


        is_new_user = (
            user is None
        )


        if user is None:

            user = User.objects.create_user(

                email=email,

                first_name=(
                    google_user["first_name"]
                ),

                last_name=(
                    google_user["last_name"]
                ),

                profile_picture=(
                    google_user["profile_picture"]
                ),

                google_id=google_id,
            )

        else:

            changed = []


            if user.google_id != google_id:

                user.google_id = google_id

                changed.append(
                    "google_id"
                )


            if (
                not user.first_name
                and google_user["first_name"]
            ):

                user.first_name = (
                    google_user["first_name"]
                )

                changed.append(
                    "first_name"
                )


            if (
                not user.last_name
                and google_user["last_name"]
            ):

                user.last_name = (
                    google_user["last_name"]
                )

                changed.append(
                    "last_name"
                )


            if (
                not user.profile_picture
                and google_user["profile_picture"]
            ):

                user.profile_picture = (
                    google_user["profile_picture"]
                )

                changed.append(
                    "profile_picture"
                )


            if changed:

                user.save(
                    update_fields=changed
                )


        refresh = RefreshToken.for_user(
            user
        )

        access_token = (
            refresh.access_token
        )


        return Response(
            {

                "access":
                    str(access_token),

                "refresh":
                    str(refresh),

                "is_new_user":
                    is_new_user,

                "user": {

                    "id":
                        user.id,

                    "email":
                        user.email,

                    "first_name":
                        user.first_name,

                    "last_name":
                        user.last_name,

                    "profile_picture":
                        user.profile_picture,
                },
            }
        )

class ProfileAPI(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request
    ):

        user = request.user

        return Response({

            "id":
                user.id,

            "email":
                user.email,

            "first_name":
                user.first_name,

            "last_name":
                user.last_name,

            "profile_picture":
                user.profile_picture,
        })


class LogoutAPI(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request
    ):

        refresh_token = request.data.get(
            "refresh"
        )

        if refresh_token:

            try:

                token = RefreshToken(
                    refresh_token
                )

                token.blacklist()

            except Exception:

                pass


        return Response({

            "message":
                "Logged out successfully."
        })