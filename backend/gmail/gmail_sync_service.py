from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from django.utils import timezone

from jobs.gmail_import_service import GmailJobApplicationImporter
from .gmail_parser import GmailMessageParser
from .gmail_service import GmailService
from .models import GmailJobEmail
from .oauth_service import GmailOAuthService


class GmailSyncService:
    PAGE_SIZE = 25
    MAX_METADATA_WORKERS = 8

    JOB_SEARCH_TERMS = [
        "application",
        "applied",
        "candidacy",
        "candidate",
        "interview",
        "assessment",
        "shortlisted",
        "offer",
        "rejected",
        "hackerrank",
        "codility",
        "hirevue",
        "greenhouse",
        "lever",
        "workday",
        "ashby",
        "smartrecruiters",
    ]

    METADATA_HEADERS = [
        "From",
        "Subject",
        "Date",
        "To",
    ]

    @classmethod
    def build_job_search_query(cls, job_search_started_on=None):
        keyword_query = " OR ".join(cls.JOB_SEARCH_TERMS)
        date_filter = ""
        if job_search_started_on:
            date_filter = f" after:{job_search_started_on.strftime('%Y/%m/%d')}"
        return f"-category:promotions -category:social {{{keyword_query}}}{date_filter}"

    @classmethod
    def get_matched_header_keywords(cls, sender, subject):
        searchable_text = f"{sender} {subject}".lower()
        matched_keywords = []

        for keyword in cls.JOB_SEARCH_TERMS:
            clean_keyword = keyword.replace('"', "").lower()
            if clean_keyword in searchable_text:
                matched_keywords.append(clean_keyword)

        return matched_keywords

    @classmethod
    def fetch_message_metadata(cls, access_token, message_id, max_retries=2):
        """Tier 1: Fetches only metadata headers without body with rate-limit retry."""
        import time
        for attempt in range(max_retries + 1):
            try:
                return GmailOAuthService.get_message(
                    access_token=access_token,
                    message_id=message_id,
                    message_format="metadata",
                    metadata_headers=cls.METADATA_HEADERS,
                )
            except requests.HTTPError as err:
                if err.response is not None and err.response.status_code in (403, 429) and attempt < max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise

    @classmethod
    def fetch_metadata_batch(cls, access_token, message_ids):
        if not message_ids:
            return []

        metadata_by_message_id = {}
        worker_count = min(cls.MAX_METADATA_WORKERS, len(message_ids))

        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            future_to_message_id = {
                executor.submit(cls.fetch_message_metadata, access_token, message_id): message_id
                for message_id in message_ids
            }

            for future in as_completed(future_to_message_id):
                message_id = future_to_message_id[future]
                try:
                    metadata_by_message_id[message_id] = future.result()
                except Exception as exc:
                    print("GMAIL METADATA FETCH FAILED:", message_id, repr(exc))

        return [
            metadata_by_message_id[message_id]
            for message_id in message_ids
            if message_id in metadata_by_message_id
        ]

    @classmethod
    def initialize_history_checkpoint(cls, connection):
        access_token = GmailService.get_valid_access_token(connection)
        account_data = GmailOAuthService.get_google_account(access_token)
        history_id = account_data.get("historyId")

        if not history_id:
            raise ValueError("Google did not return a Gmail history ID.")

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
    def process_metadata_batch(cls, connection, access_token, metadata_messages):
        """
        High-performance privacy-first batch pipeline:
        1. Filters metadata through Tier 1 Gatekeeper (zero non-job processing).
        2. Extracts headers and snippets directly from metadata messages.
        3. Imports candidates through semantic parser and deduplication pipeline in parallel.
        """
        if not metadata_messages:
            return {"created_count": 0, "existing_count": 0, "ignored_count": 0}

        created_count = 0
        existing_count = 0
        ignored_count = 0
        candidates_to_import = []

        for meta in metadata_messages:
            headers = GmailMessageParser.get_headers(meta)
            sender = headers.get("from") or ""
            subject = headers.get("subject") or ""
            mid = meta.get("id")
            thread_id = meta.get("threadId", "")

            # --- TIER 1 GATEKEEPER: Drop non-job, social, and aggregator promotional emails ---
            if not GmailJobApplicationImporter.is_verified_job_email(sender=sender, subject=subject):
                ignored_count += 1
                continue

            matched_keywords = cls.get_matched_header_keywords(sender=sender, subject=subject)

            snippet = GmailMessageParser.get_snippet(meta)
            email_date = headers.get("date") or ""

            candidate, created = GmailJobEmail.objects.get_or_create(
                gmail_connection=connection,
                message_id=mid,
                defaults={
                    "thread_id": thread_id,
                    "sender": sender,
                    "subject": subject,
                    "snippet": snippet,
                    "body_text": snippet,
                    "email_date": email_date,
                    "matched_keywords": matched_keywords,
                },
            )

            if created:
                created_count += 1
            else:
                if not candidate.snippet and snippet:
                    candidate.snippet = snippet
                    candidate.body_text = snippet
                    candidate.save(update_fields=["snippet", "body_text"])
                existing_count += 1
                if not candidate.job_application_id:
                    candidates_to_import.append(candidate)

        # Run semantic classifier and deduplication with pacing to prevent quota bursts
        if candidates_to_import:
            for cand in candidates_to_import:
                GmailJobApplicationImporter.import_candidate(cand)

        return {
            "created_count": created_count,
            "existing_count": existing_count,
            "ignored_count": ignored_count,
        }

    @classmethod
    def sync_historical_job_emails(cls, connection, max_pages=1):
        if connection.historical_sync_completed:
            # Recover any candidates whose initial Gemini analysis failed or was rate-limited
            unprocessed = list(GmailJobEmail.objects.filter(
                gmail_connection=connection,
                job_application_id__isnull=True,
            )[:15])
            if unprocessed:
                for cand in unprocessed:
                    GmailJobApplicationImporter.import_candidate(cand)

            return {
                "search_query": cls.build_job_search_query(connection.job_search_started_on),
                "candidate_count": 0,
                "created_count": 0,
                "existing_count": len(unprocessed),
                "has_more": False,
                "message": "Historical Gmail sync is already complete.",
            }

        access_token = GmailService.get_valid_access_token(connection)
        search_query = cls.build_job_search_query(connection.job_search_started_on)

        total_created = 0
        total_existing = 0
        total_messages_seen = 0
        current_page_token = connection.historical_next_page_token
        pages_processed = 0

        while pages_processed < max_pages:
            messages_data = GmailOAuthService.list_messages(
                access_token=access_token,
                query=search_query,
                max_results=cls.PAGE_SIZE,
                page_token=current_page_token,
            )

            messages = messages_data.get("messages", [])
            if not messages:
                current_page_token = None
                break

            total_messages_seen += len(messages)
            message_ids = [m.get("id") for m in messages if m.get("id")]
            metadata_messages = cls.fetch_metadata_batch(
                access_token=access_token,
                message_ids=message_ids,
            )

            batch_result = cls.process_metadata_batch(
                connection=connection,
                access_token=access_token,
                metadata_messages=metadata_messages,
            )
            total_created += batch_result["created_count"]
            total_existing += batch_result["existing_count"]

            current_page_token = messages_data.get("nextPageToken")
            pages_processed += 1
            if not current_page_token:
                break

        connection.historical_next_page_token = current_page_token
        update_fields = ["historical_next_page_token"]

        if not current_page_token:
            connection.historical_sync_completed = True
            connection.last_sync_at = timezone.now()
            cls.initialize_history_checkpoint(connection)
            update_fields.extend(["historical_sync_completed", "last_sync_at"])

        connection.save(update_fields=update_fields)

        return {
            "search_query": search_query,
            "candidate_count": total_messages_seen,
            "created_count": total_created,
            "existing_count": total_existing,
            "has_more": bool(current_page_token),
            "message": (
                "Historical sync in progress..."
                if current_page_token
                else "Historical Gmail sync is complete."
            ),
        }

    @classmethod
    def get_added_message_ids(cls, history_data):
        message_ids = []
        seen_message_ids = set()

        for history_record in history_data.get("history", []):
            messages_added = history_record.get("messagesAdded", [])
            for message_added in messages_added:
                message = message_added.get("message", {})
                message_id = message.get("id")
                if message_id and message_id not in seen_message_ids:
                    seen_message_ids.add(message_id)
                    message_ids.append(message_id)

        return message_ids

    @classmethod
    def sync_incremental_job_emails(cls, connection):
        if not connection.last_history_id:
            cls.initialize_history_checkpoint(connection)

        access_token = GmailService.get_valid_access_token(connection)

        try:
            history_data = GmailOAuthService.list_history(
                access_token=access_token,
                start_history_id=connection.last_history_id,
                max_results=cls.PAGE_SIZE,
                page_token=connection.incremental_next_page_token,
            )
        except requests.HTTPError as err:
            # If historyId has expired (>7 days) or returned 404/400, recover automatically
            if err.response is not None and err.response.status_code in (400, 404):
                print("HISTORY ID EXPIRED, RE-INITIALIZING CHECKPOINT...")
                cls.initialize_history_checkpoint(connection)
                # Fallback to search query for recent messages
                return cls.sync_recent_query_fallback(connection, access_token)
            raise

        current_history_id = history_data.get("historyId")
        if not connection.pending_history_id and current_history_id:
            connection.pending_history_id = current_history_id

        message_ids = cls.get_added_message_ids(history_data)
        metadata_messages = cls.fetch_metadata_batch(
            access_token=access_token,
            message_ids=message_ids,
        )

        batch_result = cls.process_metadata_batch(
            connection=connection,
            access_token=access_token,
            metadata_messages=metadata_messages,
        )
        created_count = batch_result["created_count"]
        existing_count = batch_result["existing_count"]
        ignored_count = batch_result["ignored_count"]

        # Recover any previously unprocessed candidates
        unprocessed = list(GmailJobEmail.objects.filter(
            gmail_connection=connection,
            job_application_id__isnull=True,
        )[:10])
        if unprocessed:
            for cand in unprocessed:
                GmailJobApplicationImporter.import_candidate(cand)

        next_page_token = history_data.get("nextPageToken")
        connection.incremental_next_page_token = next_page_token
        update_fields = ["incremental_next_page_token", "pending_history_id"]

        if not next_page_token:
            connection.last_history_id = (
                connection.pending_history_id or current_history_id
            )
            connection.pending_history_id = None
            connection.last_sync_at = timezone.now()
            update_fields.extend(["last_history_id", "last_sync_at"])

        connection.save(update_fields=update_fields)

        return {
            "new_message_count": len(message_ids),
            "created_count": created_count,
            "existing_count": existing_count,
            "ignored_count": ignored_count,
            "has_more": bool(next_page_token),
            "message": (
                "One page of new Gmail changes was synced."
                if next_page_token
                else "New Gmail changes were synced."
            ),
        }

    @classmethod
    def sync_recent_query_fallback(cls, connection, access_token):
        """Fallback when History ID has expired: runs search query for recent messages."""
        search_query = cls.build_job_search_query()
        messages_data = GmailOAuthService.list_messages(
            access_token=access_token,
            query=search_query,
            max_results=cls.PAGE_SIZE,
        )
        messages = messages_data.get("messages", [])
        message_ids = [m.get("id") for m in messages if m.get("id")]
        metadata_messages = cls.fetch_metadata_batch(
            access_token=access_token,
            message_ids=message_ids,
        )

        batch_result = cls.process_metadata_batch(
            connection=connection,
            access_token=access_token,
            metadata_messages=metadata_messages,
        )
        created_count = batch_result["created_count"]
        existing_count = batch_result["existing_count"]

        connection.last_sync_at = timezone.now()
        connection.save(update_fields=["last_sync_at"])

        return {
            "new_message_count": len(message_ids),
            "created_count": created_count,
            "existing_count": existing_count,
            "ignored_count": batch_result["ignored_count"],
            "has_more": False,
            "message": "Gmail sync refreshed successfully.",
        }

