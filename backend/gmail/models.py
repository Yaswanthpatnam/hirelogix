from django.conf import settings
from django.db import models


class GmailConnection(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="gmail_connection",
    )

    google_email = models.EmailField(
        unique=True
    )

    access_token = models.TextField()

    refresh_token = models.TextField(
        blank=True,
        null=True,
    )

    token_expires_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    scopes = models.TextField(
        blank=True,
    )

    job_search_started_on = models.DateField(
        blank=True,
        null=True,
    )

    connected_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    last_sync_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    last_history_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    incremental_next_page_token = models.TextField(
        blank=True,
        null=True,
    )

    pending_history_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    historical_next_page_token = models.TextField(
        blank=True,
        null=True,
    )

    historical_sync_completed = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True
    )

    def __str__(self):
        return self.google_email


class GmailOAuthTransaction(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="gmail_oauth_transactions",
    )

    state_hash = models.CharField(
        max_length=64,
        unique=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    expires_at = models.DateTimeField()

    used = models.BooleanField(
        default=False,
    )

    def __str__(self):
        return (
            f"Gmail OAuth transaction for "
            f"{self.user.email}"
        )


class GmailJobEmail(models.Model):

    gmail_connection = models.ForeignKey(
        GmailConnection,
        on_delete=models.CASCADE,
        related_name="job_emails",
    )

    message_id = models.CharField(
        max_length=255,
    )

    thread_id = models.CharField(
        max_length=255,
    )

    sender = models.TextField(
        blank=True,
    )

    subject = models.TextField(
        blank=True,
    )

    email_date = models.TextField(
        blank=True,
    )

    matched_keywords = models.JSONField(
        default=list,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "gmail_connection",
                    "message_id",
                ],
                name="unique_gmail_message_per_connection",
            )
        ]

    def __str__(self):
        return self.subject or self.message_id