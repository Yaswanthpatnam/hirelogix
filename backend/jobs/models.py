from django.conf import settings
from django.db import models


class JobApplication(models.Model):

    class Status(models.TextChoices):

        APPLIED = (
            "applied",
            "Applied",
        )

        UNDER_REVIEW = (
            "under_review",
            "Under Review",
        )

        INTERVIEW = (
            "interview",
            "Interview",
        )

        ASSESSMENT = (
            "assessment",
            "Assessment",
        )

        OFFER = (
            "offer",
            "Offer",
        )

        REJECTED = (
            "rejected",
            "Rejected",
        )

    class Source(models.TextChoices):

        GMAIL = (
            "gmail",
            "Gmail",
        )

        MANUAL = (
            "manual",
            "Manual",
        )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )

    company_name = models.CharField(
        max_length=255,
    )

    role_title = models.CharField(
        max_length=255,
        blank=True,
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.APPLIED,
    )

    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.MANUAL,
    )

    gmail_thread_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    last_gmail_message_id = models.CharField(
        max_length=255,
        blank=True,
    )

    last_email_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "user",
                    "gmail_thread_id",
                ],
                name=(
                    "unique_gmail_thread_per_user"
                ),
            )
        ]

        ordering = [
            "-last_email_at",
            "-updated_at",
        ]

    def __str__(self):
        return (
            f"{self.company_name} - "
            f"{self.get_status_display()}"
        )