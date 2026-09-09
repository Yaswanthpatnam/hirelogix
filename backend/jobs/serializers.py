from rest_framework import serializers

from .models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    source_display = serializers.CharField(
        source="get_source_display",
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
            "last_email_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "source",
            "source_display",
            "last_email_at",
            "created_at",
            "updated_at",
        ]