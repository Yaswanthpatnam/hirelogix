from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .gmail_sync_service import GmailSyncService
from .models import GmailConnection


class GmailIncrementalSyncAPI(APIView):

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

        try:
            # Auto-initialize History API checkpoint if not yet set
            if not connection.last_history_id:
                GmailSyncService.initialize_history_checkpoint(connection)

            sync_result = GmailSyncService.sync_incremental_job_emails(connection)
            return Response(sync_result, status=status.HTTP_200_OK)

        except ValueError as exc:

            return Response(
                {
                    "error":
                        str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as exc:

            print(
                "GMAIL INCREMENTAL SYNC ERROR:",
                repr(exc),
            )

            return Response(
                {
                    "error":
                        "Unable to sync new Gmail messages."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )