from django.core.management.base import BaseCommand

from gmail.gmail_sync_service import GmailSyncService
from gmail.models import GmailConnection


class Command(BaseCommand):

    help = (
        "Sync one fast page of newly added Gmail "
        "messages for every active Gmail connection."
    )

    def handle(
        self,
        *args,
        **options,
    ):
        connections = (
            GmailConnection.objects
            .filter(
                is_active=True,
                historical_sync_completed=True,
            )
            .iterator()
        )

        processed_connections = 0

        for connection in connections:

            processed_connections += 1

            try:

                if not connection.last_history_id:

                    GmailSyncService.initialize_history_checkpoint(
                        connection
                    )

                    self.stdout.write(
                        self.style.WARNING(
                            f"{connection.google_email}: "
                            "Gmail change tracking initialized. "
                            "No messages imported in this run."
                        )
                    )

                    continue

                result = (
                    GmailSyncService
                    .sync_incremental_job_emails(
                        connection
                    )
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"{connection.google_email}: "
                        f"{result['message']} "
                        f"new={result['new_message_count']} "
                        f"created={result['created_count']} "
                        f"existing={result['existing_count']} "
                        f"ignored={result['ignored_count']} "
                        f"has_more={result['has_more']}"
                    )
                )

            except Exception as exc:

                self.stderr.write(
                    self.style.ERROR(
                        f"{connection.google_email}: "
                        f"incremental Gmail sync failed: "
                        f"{repr(exc)}"
                    )
                )

        if processed_connections == 0:

            self.stdout.write(
                self.style.WARNING(
                    "No completed active Gmail "
                    "connections were found."
                )
            )

            return

        self.stdout.write(
            self.style.SUCCESS(
                "Automatic Gmail incremental sync "
                "run completed."
            )
        )