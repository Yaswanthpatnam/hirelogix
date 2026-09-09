from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import as_completed

from django.utils import timezone

from .gmail_parser import GmailMessageParser
from .gmail_service import GmailService
from .models import GmailJobEmail
from .oauth_service import GmailOAuthService


class GmailSyncService:

    PAGE_SIZE = 10

    MAX_METADATA_WORKERS = 5

    JOB_SEARCH_TERMS = [
        "\"application received\"",
        "\"application status\"",
        "\"application update\"",
        "\"under review\"",
        "\"coding test\"",
        "\"online assessment\"",
        "\"offer letter\"",
        "interview",
        "assessment",
        "recruiter",
        "rejected",
        "hiring",
    ]

    METADATA_HEADERS = [
        "From",
        "Subject",
        "Date",
    ]

    @classmethod
    def build_job_search_query(
        cls,
        job_search_started_on,
    ):
        formatted_date = (
            job_search_started_on.strftime(
                "%Y/%m/%d"
            )
        )

        keyword_query = " OR ".join(
            cls.JOB_SEARCH_TERMS
        )

        return (
            f"after:{formatted_date} "
            f"-category:promotions "
            f"-category:social "
            f"{{{keyword_query}}}"
        )

    @classmethod
    def get_matched_header_keywords(
        cls,
        sender,
        subject,
    ):
        searchable_text = (
            f"{sender} {subject}"
        ).lower()

        matched_keywords = []

        for keyword in cls.JOB_SEARCH_TERMS:

            clean_keyword = (
                keyword.replace(
                    "\"",
                    "",
                ).lower()
            )

            if clean_keyword in searchable_text:
                matched_keywords.append(
                    clean_keyword
                )

        return matched_keywords

    @classmethod
    def fetch_message_metadata(
        cls,
        access_token,
        message_id,
    ):
        return (
            GmailOAuthService.get_message(
                access_token=access_token,
                message_id=message_id,
                message_format="metadata",
                metadata_headers=(
                    cls.METADATA_HEADERS
                ),
            )
        )

    @classmethod
    def fetch_metadata_batch(
        cls,
        access_token,
        message_ids,
    ):
        if not message_ids:
            return []

        metadata_by_message_id = {}

        worker_count = min(
            cls.MAX_METADATA_WORKERS,
            len(message_ids),
        )

        with ThreadPoolExecutor(
            max_workers=worker_count
        ) as executor:

            future_to_message_id = {
                executor.submit(
                    cls.fetch_message_metadata,
                    access_token,
                    message_id,
                ): message_id
                for message_id in message_ids
            }

            for future in as_completed(
                future_to_message_id
            ):
                message_id = (
                    future_to_message_id[
                        future
                    ]
                )

                metadata_by_message_id[
                    message_id
                ] = future.result()

        return [
            metadata_by_message_id[message_id]
            for message_id in message_ids
            if message_id in metadata_by_message_id
        ]

    @classmethod
    def initialize_history_checkpoint(
        cls,
        connection,
    ):
        access_token = (
            GmailService.get_valid_access_token(
                connection
            )
        )

        account_data = (
            GmailOAuthService.get_google_account(
                access_token
            )
        )

        history_id = account_data.get(
            "historyId"
        )

        if not history_id:
            raise ValueError(
                "Google did not return a Gmail history ID."
            )

        connection.last_history_id = history_id

        connection.incremental_next_page_token = None

        connection.pending_history_id = None

        connection.save(
            update_fields=[
                "last_history_id",
                "incremental_next_page_token",
                "pending_history_id",
            ]
        )

        return history_id

    @classmethod
    def create_historical_candidate(
        cls,
        connection,
        metadata_message,
    ):
        headers = GmailMessageParser.get_headers(
            metadata_message
        )

        sender = headers.get("from") or ""
        subject = headers.get("subject") or ""

        matched_keywords = (
            cls.get_matched_header_keywords(
                sender=sender,
                subject=subject,
            )
        )

        _, created = (
            GmailJobEmail.objects
            .get_or_create(
                gmail_connection=connection,
                message_id=metadata_message.get(
                    "id"
                ),
                defaults={
                    "thread_id":
                        metadata_message.get(
                            "threadId",
                            "",
                        ),
                    "sender":
                        sender,
                    "subject":
                        subject,
                    "email_date":
                        headers.get("date")
                        or "",
                    "matched_keywords":
                        matched_keywords,
                },
            )
        )

        return created

    @classmethod
    def create_incremental_candidate(
        cls,
        connection,
        metadata_message,
    ):
        headers = GmailMessageParser.get_headers(
            metadata_message
        )

        sender = headers.get("from") or ""
        subject = headers.get("subject") or ""

        matched_keywords = (
            cls.get_matched_header_keywords(
                sender=sender,
                subject=subject,
            )
        )

        if not matched_keywords:
            return "ignored"

        _, created = (
            GmailJobEmail.objects
            .get_or_create(
                gmail_connection=connection,
                message_id=metadata_message.get(
                    "id"
                ),
                defaults={
                    "thread_id":
                        metadata_message.get(
                            "threadId",
                            "",
                        ),
                    "sender":
                        sender,
                    "subject":
                        subject,
                    "email_date":
                        headers.get("date")
                        or "",
                    "matched_keywords":
                        matched_keywords,
                },
            )
        )

        if created:
            return "created"

        return "existing"

    @classmethod
    def sync_historical_job_emails(
        cls,
        connection,
    ):
        if not connection.job_search_started_on:
            raise ValueError(
                "Set job_search_started_on before "
                "syncing Gmail."
            )

        if connection.historical_sync_completed:
            return {
                "search_query": (
                    cls.build_job_search_query(
                        connection
                        .job_search_started_on
                    )
                ),
                "candidate_count": 0,
                "created_count": 0,
                "existing_count": 0,
                "has_more": False,
                "message":
                    "Historical Gmail sync is already complete.",
            }

        access_token = (
            GmailService.get_valid_access_token(
                connection
            )
        )

        search_query = (
            cls.build_job_search_query(
                connection.job_search_started_on
            )
        )

        messages_data = (
            GmailOAuthService.list_messages(
                access_token=access_token,
                query=search_query,
                max_results=cls.PAGE_SIZE,
                page_token=(
                    connection
                    .historical_next_page_token
                ),
            )
        )

        messages = messages_data.get(
            "messages",
            []
        )

        message_ids = [
            message.get("id")
            for message in messages
            if message.get("id")
        ]

        metadata_messages = (
            cls.fetch_metadata_batch(
                access_token=access_token,
                message_ids=message_ids,
            )
        )

        created_count = 0
        existing_count = 0

        for metadata_message in metadata_messages:

            created = (
                cls.create_historical_candidate(
                    connection=connection,
                    metadata_message=metadata_message,
                )
            )

            if created:
                created_count += 1
            else:
                existing_count += 1

        next_page_token = (
            messages_data.get(
                "nextPageToken"
            )
        )

        connection.historical_next_page_token = (
            next_page_token
        )

        update_fields = [
            "historical_next_page_token",
        ]

        if not next_page_token:

            connection.historical_sync_completed = True

            connection.last_sync_at = (
                timezone.now()
            )

            cls.initialize_history_checkpoint(
                connection
            )

            update_fields.extend(
                [
                    "historical_sync_completed",
                    "last_sync_at",
                ]
            )

        connection.save(
            update_fields=update_fields
        )

        return {
            "search_query": search_query,
            "candidate_count": len(messages),
            "created_count": created_count,
            "existing_count": existing_count,
            "has_more": bool(next_page_token),
            "message": (
                "One page of Gmail candidates was synced."
                if next_page_token
                else
                "Historical Gmail sync is complete."
            ),
        }

    @classmethod
    def get_added_message_ids(
        cls,
        history_data,
    ):
        message_ids = []
        seen_message_ids = set()

        for history_record in history_data.get(
            "history",
            []
        ):
            messages_added = history_record.get(
                "messagesAdded",
                []
            )

            for message_added in messages_added:

                message = message_added.get(
                    "message",
                    {}
                )

                message_id = message.get("id")

                if (
                    message_id
                    and message_id not in seen_message_ids
                ):
                    seen_message_ids.add(
                        message_id
                    )

                    message_ids.append(
                        message_id
                    )

        return message_ids

    @classmethod
    def sync_incremental_job_emails(
        cls,
        connection,
    ):
        if not connection.last_history_id:
            raise ValueError(
                "Initialize the Gmail history checkpoint "
                "before incremental syncing."
            )

        access_token = (
            GmailService.get_valid_access_token(
                connection
            )
        )

        history_data = (
            GmailOAuthService.list_history(
                access_token=access_token,
                start_history_id=(
                    connection.last_history_id
                ),
                max_results=cls.PAGE_SIZE,
                page_token=(
                    connection
                    .incremental_next_page_token
                ),
            )
        )

        current_history_id = history_data.get(
            "historyId"
        )

        if (
            not connection.pending_history_id
            and current_history_id
        ):
            connection.pending_history_id = (
                current_history_id
            )

        message_ids = (
            cls.get_added_message_ids(
                history_data
            )
        )

        metadata_messages = (
            cls.fetch_metadata_batch(
                access_token=access_token,
                message_ids=message_ids,
            )
        )

        created_count = 0
        existing_count = 0
        ignored_count = 0

        for metadata_message in metadata_messages:

            result = (
                cls.create_incremental_candidate(
                    connection=connection,
                    metadata_message=metadata_message,
                )
            )

            if result == "created":
                created_count += 1

            elif result == "existing":
                existing_count += 1

            else:
                ignored_count += 1

        next_page_token = (
            history_data.get(
                "nextPageToken"
            )
        )

        connection.incremental_next_page_token = (
            next_page_token
        )

        update_fields = [
            "incremental_next_page_token",
            "pending_history_id",
        ]

        if not next_page_token:

            connection.last_history_id = (
                connection.pending_history_id
                or current_history_id
            )

            connection.pending_history_id = None

            connection.last_sync_at = (
                timezone.now()
            )

            update_fields.extend(
                [
                    "last_history_id",
                    "last_sync_at",
                ]
            )

        connection.save(
            update_fields=update_fields
        )

        return {
            "new_message_count": len(message_ids),
            "created_count": created_count,
            "existing_count": existing_count,
            "ignored_count": ignored_count,
            "has_more": bool(next_page_token),
            "message": (
                "One page of new Gmail changes was synced."
                if next_page_token
                else
                "New Gmail changes were synced."
            ),
        }