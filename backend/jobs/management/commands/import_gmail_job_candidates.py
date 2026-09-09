from django.core.management.base import BaseCommand

from gmail.models import GmailJobEmail
from jobs.gmail_import_service import (
    GmailJobApplicationImporter,
)


class Command(BaseCommand):

    help = (
        "Create or update dashboard job applications "
        "from safe Gmail candidate metadata."
    )

    def handle(
        self,
        *args,
        **options,
    ):
        candidates = (
            GmailJobEmail.objects
            .select_related(
                "gmail_connection",
                "gmail_connection__user",
            )
            .order_by(
                "created_at"
            )
        )

        created_count = 0
        updated_or_existing_count = 0
        skipped_count = 0

        for candidate in candidates:

            application, created = (
                GmailJobApplicationImporter
                .import_candidate(
                    candidate
                )
            )

            if not application:
                skipped_count += 1
                continue

            if created:
                created_count += 1
            else:
                updated_or_existing_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Gmail candidate import completed. "
                f"created={created_count} "
                f"updated_or_existing="
                f"{updated_or_existing_count} "
                f"skipped={skipped_count}"
            )
        )