from rest_framework import serializers
from gmail.models import GmailJobEmail
from .models import JobApplication


class JobEmailTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = GmailJobEmail
        fields = [
            "id",
            "message_id",
            "thread_id",
            "sender",
            "subject",
            "snippet",
            "email_date",
            "created_at",
        ]


class JobApplicationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    source_display = serializers.CharField(
        source="get_source_display",
        read_only=True,
    )

    emails = JobEmailTimelineSerializer(
        source="job_emails",
        many=True,
        read_only=True,
    )

    class Meta:
        model = JobApplication
        fields = [
            "id",
            "company_name",
            "role_title",
            "status",
            "status_display",
            "source",
            "source_display",
            "interview_date",
            "interview_link",
            "salary_text",
            "location_text",
            "thread_ids",
            "emails",
            "last_email_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "source",
            "source_display",
            "thread_ids",
            "emails",
            "last_email_at",
            "created_at",
            "updated_at",
        ]