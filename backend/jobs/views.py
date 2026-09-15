from datetime import timedelta
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from gmail.models import GmailJobEmail
from .gmail_import_service import GmailJobApplicationImporter
from .models import JobApplication
from .pagination import JobApplicationPagination
from .serializers import JobApplicationSerializer


class JobApplicationListView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = JobApplicationPagination

    def get_queryset(self):
        queryset = JobApplication.objects.filter(
            user=self.request.user,
        ).prefetch_related("job_emails")

        status_param = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        ordering = self.request.query_params.get("ordering", "-last_email_at")

        if status_param and status_param != "all":
            queryset = queryset.filter(status=status_param)

        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search)
                | Q(role_title__icontains=search)
                | Q(location_text__icontains=search)
                | Q(job_emails__snippet__icontains=search)
            ).distinct()

        # Handle custom ordering safely
        allowed_ordering = {
            "last_email_at": "last_email_at",
            "-last_email_at": "-last_email_at",
            "created_at": "created_at",
            "-created_at": "-created_at",
            "company_name": "company_name",
            "-company_name": "-company_name",
            "status": "status",
        }
        order_by = allowed_ordering.get(ordering, "-last_email_at")
        return queryset.order_by(order_by, "-updated_at")


class JobApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(
            user=self.request.user,
        ).prefetch_related("job_emails")


class JobApplicationSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        apps = JobApplication.objects.filter(user=user)

        status_counts = dict(
            apps.values("status")
            .annotate(count=Count("id"))
            .values_list("status", "count")
        )
        total = sum(status_counts.values())

        applied = status_counts.get(JobApplication.Status.APPLIED, 0)
        under_review = status_counts.get(JobApplication.Status.UNDER_REVIEW, 0)
        interview = status_counts.get(JobApplication.Status.INTERVIEW, 0)
        assessment = status_counts.get(JobApplication.Status.ASSESSMENT, 0)
        offer = status_counts.get(JobApplication.Status.OFFER, 0)
        rejected = status_counts.get(JobApplication.Status.REJECTED, 0)

        active = total - rejected
        responded = under_review + assessment + interview + offer + rejected
        response_rate = round((responded / total * 100), 1) if total > 0 else 0
        interview_rate = round(((interview + offer) / total * 100), 1) if total > 0 else 0
        offer_rate = round((offer / total * 100), 1) if total > 0 else 0

        summary = {
            "total": total,
            "applied": applied,
            "under_review": under_review,
            "interview": interview,
            "assessment": assessment,
            "offer": offer,
            "rejected": rejected,
            "active": active,
            "insights": {
                "response_rate": response_rate,
                "interview_rate": interview_rate,
                "offer_rate": offer_rate,
                "active_count": active,
            },
            "activity": self.build_activity(apps),
            "timeline": self.build_timeline(user),
            "historical": {
                "total_applications": total,
                "ever_under_review": under_review,
                "ever_assessment": assessment,
                "ever_interview": interview,
                "ever_offer": offer,
                "ever_rejected": rejected,
                "response_count": responded,
            },
        }

        return Response(summary)

    def build_activity(self, apps):
        today = timezone.localdate()
        days = []

        for offset in range(6, -1, -1):
            current_day = today - timedelta(days=offset)
            days.append({
                "key": current_day.isoformat(),
                "label": current_day.strftime("%a"),
                "value": 0,
            })

        day_map = {item["key"]: item for item in days}

        for app in apps:
            app_date = app.last_email_at or app.created_at
            if not app_date:
                continue

            local_date = timezone.localtime(app_date).date()
            day = day_map.get(local_date.isoformat())
            if day:
                day["value"] += 1

        return days

    def build_timeline(self, user):
        """Constructs unified multi-thread timeline sorted by most recent email/update."""
        recent_apps = JobApplication.objects.filter(
            user=user,
        ).prefetch_related("job_emails").order_by("-last_email_at", "-updated_at")[:25]

        timeline = []
        for app in recent_apps:
            latest_email = app.job_emails.order_by("-created_at").first()
            subject = latest_email.subject if latest_email else ""
            snippet = latest_email.snippet if latest_email else ""

            timeline.append({
                "job_id": app.id,
                "company_name": app.company_name,
                "role_title": app.role_title,
                "status": app.status,
                "status_display": app.get_status_display(),
                "event_date": app.last_email_at or app.updated_at or app.created_at,
                "subject": subject,
                "snippet": snippet,
                "interview_link": app.interview_link,
                "email_count": app.job_emails.count(),
            })

        return timeline