from django.db.models.signals import post_save
from django.dispatch import receiver

from gmail.models import GmailJobEmail

from .gmail_import_service import (
    GmailJobApplicationImporter,
)


# All ingestion and deduplication is managed through GmailSyncService.import_candidates_batch
# Synchronous post_save signals are disabled to prevent race conditions and duplicate calls.