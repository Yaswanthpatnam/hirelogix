from django.db import models
from django.conf import settings


class JobApplication(models.Model):

    STAGE_CHOICES = [
        ("APPLIED", "Applied"),
        ("SHORTLISTED", "Shortlisted"),
        ("ASSESSMENT", "Assessment"),
        ("INTERVIEW", "Interview"),
        ("OFFER", "Offer"),
    ]

    VERDICT_CHOICES = [
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
        ("GHOSTED", "Ghosted"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jobs",
        db_index=True,  
    )

    job_title = models.CharField(max_length=100)
    company = models.CharField(max_length=100)

    stage = models.CharField(
        max_length=20,
        choices=STAGE_CHOICES,
        default="APPLIED",
        db_index=True,  
    )

    verdict = models.CharField(
        max_length=20,
        choices=VERDICT_CHOICES,
        null=True,
        blank=True,
        db_index=True, 
    )

    max_salary = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    resume = models.FileField(
        upload_to="resumes/",
        null=True,
        blank=True
    )

    notes = models.TextField(null=True, blank=True)

    applied_date = models.DateField(db_index=True)
    follow_up_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
           
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "stage"]),
            models.Index(fields=["user", "verdict"]),
        ]

    def __str__(self):
        return f"{self.job_title} at {self.company}"


class StageHistory(models.Model):
    job = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name="history",
        db_index=True,
    )

    from_stage = models.CharField(max_length=20)
    to_stage = models.CharField(max_length=20)

    changed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["job", "-changed_at"]),
        ]

    def __str__(self):
        return f"{self.from_stage} → {self.to_stage}"