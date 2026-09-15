from django.db.models.signals import post_save
from django.dispatch import receiver

from gmail.models import GmailJobEmail

from .gmail_import_service import (
    GmailJobApplicationImporter,
)


@receiver(post_save, sender=GmailJobEmail)
def import_new_gmail_candidate(sender, instance, created, **kwargs):
    if not created:
        return
    if getattr(instance, "job_application_id", None):
        return
    GmailJobApplicationImporter.import_candidate(instance)