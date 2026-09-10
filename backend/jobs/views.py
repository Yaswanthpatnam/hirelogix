from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from gmail.models import GmailJobEmail

from .gmail_import_service import (
    GmailJobApplicationImporter,
)
from .models import JobApplication
from .pagination import JobApplicationPagination
from .serializers import JobApplicationSerializer


class JobApplicationListView(
    generics.ListAPIView
):
    serializer_class = JobApplicationSerializer
    permission_classes = [
        IsAuthenticated
    ]
    pagination_class = JobApplicationPagination

    def get_queryset(self):
        queryset = JobApplication.objects.filter(
            user=self.request.user,
        )

        status = self.request.query_params.get(
            "status",
        )

        search = self.request.query_params.get(
            "search",
        )

        if status:
            queryset = queryset.filter(
                status=status,
            )

        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search)
                | Q(role_title__icontains=search)
            )

        return queryset


class JobApplicationDetailView(
    generics.RetrieveAPIView
):
    serializer_class = JobApplicationSerializer
    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):
        return JobApplication.objects.filter(
            user=self.request.user,
        )


class JobApplicationSummaryView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):
        queryset = JobApplication.objects.filter(
            user=request.user,
        )

        summary = {
            "total": queryset.count(),

            "applied": queryset.filter(
                status=JobApplication.Status.APPLIED,
            ).count(),

            "under_review": queryset.filter(
                status=JobApplication.Status.UNDER_REVIEW,
            ).count(),

            "interview": queryset.filter(
                status=JobApplication.Status.INTERVIEW,
            ).count(),

            "assessment": queryset.filter(
                status=JobApplication.Status.ASSESSMENT,
            ).count(),

            "offer": queryset.filter(
                status=JobApplication.Status.OFFER,
            ).count(),

            "rejected": queryset.filter(
                status=JobApplication.Status.REJECTED,
            ).count(),
        }

        connection = (
            getattr(
                request.user,
                "gmail_connection",
                None,
            )
        )

        activity = self.build_activity(
            connection
        )

        timeline = self.build_timeline(
            connection
        )

        historical = self.build_historical_metrics(
            connection
        )

        summary["activity"] = activity
        summary["timeline"] = timeline
        summary["historical"] = historical

        return Response(summary)

    @staticmethod
    def parse_candidate_date(
        value,
    ):
        return (
            GmailJobApplicationImporter
            .get_email_datetime(value)
        )

    def get_user_candidates(
        self,
        connection,
    ):
        if not connection:
            return []

        return list(
            GmailJobEmail.objects.filter(
                gmail_connection=connection,
            ).only(
                "thread_id",
                "sender",
                "subject",
                "email_date",
                "message_id",
            )
        )

    def build_activity(
        self,
        connection,
    ):
        today = timezone.localdate()

        days = []

        for offset in range(6, -1, -1):
            current_day = (
                today
                - timedelta(days=offset)
            )

            days.append(
                {
                    "key":
                        current_day.isoformat(),

                    "label":
                        current_day.strftime(
                            "%a"
                        ),

                    "value": 0,
                }
            )

        day_map = {
            item["key"]: item
            for item in days
        }

        candidates = (
            self.get_user_candidates(
                connection
            )
        )

        for candidate in candidates:
            status = (
                GmailJobApplicationImporter
                .get_status(
                    candidate.subject
                )
            )

            # Activity means an actual application
            # submission/confirmation, not an interview
            # or assessment update.
            if (
                status
                != JobApplication.Status.APPLIED
            ):
                continue

            candidate_date = (
                self.parse_candidate_date(
                    candidate.email_date
                )
            )

            if not candidate_date:
                continue

            local_date = timezone.localtime(
                candidate_date
            ).date()

            day = day_map.get(
                local_date.isoformat()
            )

            if day:
                day["value"] += 1

        return days

    def build_historical_metrics(
        self,
        connection,
    ):
        candidates = (
            self.get_user_candidates(
                connection
            )
        )

        threads = {}

        for candidate in candidates:
            thread_id = (
                candidate.thread_id
            )

            if not thread_id:
                continue

            status = (
                GmailJobApplicationImporter
                .get_status(
                    candidate.subject
                )
            )

            if not status:
                continue

            candidate_date = (
                self.parse_candidate_date(
                    candidate.email_date
                )
            )

            if not candidate_date:
                continue

            thread = threads.setdefault(
                thread_id,
                {
                    "applied": False,
                    "under_review": False,
                    "assessment": False,
                    "interview": False,
                    "offer": False,
                    "rejected": False,
                    "first_application_at": None,
                    "latest_at": None,
                    "latest_status": None,
                    "candidate": None,
                },
            )

            thread[status] = True

            if (
                status
                == JobApplication.Status.APPLIED
            ):
                current_first = (
                    thread[
                        "first_application_at"
                    ]
                )

                if (
                    current_first is None
                    or candidate_date
                    < current_first
                ):
                    thread[
                        "first_application_at"
                    ] = candidate_date

            current_latest = (
                thread["latest_at"]
            )

            if (
                current_latest is None
                or candidate_date
                >= current_latest
            ):
                thread["latest_at"] = (
                    candidate_date
                )

                thread["latest_status"] = (
                    status
                )

                thread["candidate"] = candidate

        application_threads = [
            thread
            for thread in threads.values()
            if thread["applied"]
        ]

        total = len(
            application_threads
        )

        ever_under_review = sum(
            1
            for thread in application_threads
            if thread["under_review"]
        )

        ever_assessment = sum(
            1
            for thread in application_threads
            if thread["assessment"]
        )

        ever_interview = sum(
            1
            for thread in application_threads
            if thread["interview"]
        )

        ever_offer = sum(
            1
            for thread in application_threads
            if thread["offer"]
        )

        ever_rejected = sum(
            1
            for thread in application_threads
            if thread["rejected"]
        )

        return {
            "total_applications":
                total,

            "ever_under_review":
                ever_under_review,

            "ever_assessment":
                ever_assessment,

            "ever_interview":
                ever_interview,

            "ever_offer":
                ever_offer,

            "ever_rejected":
                ever_rejected,

            "response_count":
                sum(
                    1
                    for thread in application_threads
                    if (
                        thread["under_review"]
                        or thread["assessment"]
                        or thread["interview"]
                        or thread["offer"]
                        or thread["rejected"]
                    )
                ),
        }

    def build_timeline(
        self,
        connection,
    ):
        candidates = (
            self.get_user_candidates(
                connection
            )
        )

        threads = {}

        for candidate in candidates:
            thread_id = (
                candidate.thread_id
            )

            if not thread_id:
                continue

            status = (
                GmailJobApplicationImporter
                .get_status(
                    candidate.subject
                )
            )

            if not status:
                continue

            candidate_date = (
                self.parse_candidate_date(
                    candidate.email_date
                )
            )

            if not candidate_date:
                continue

            existing = threads.get(
                thread_id
            )

            if (
                existing is None
                or candidate_date
                > existing["date"]
            ):
                threads[thread_id] = {
                    "date": candidate_date,
                    "status": status,
                    "subject": (
                        candidate.subject
                    ),
                    "sender": (
                        candidate.sender
                    ),
                }

        timeline = []

        for thread_id, event in threads.items():
            application = (
                JobApplication.objects.filter(
                    user=connection.user,
                    gmail_thread_id=thread_id,
                ).first()
            )

            if not application:
                continue

            timeline.append(
                {
                    "job_id":
                        application.id,

                    "company_name":
                        application.company_name,

                    "role_title":
                        application.role_title,

                    "status":
                        event["status"],

                    "status_display":
                        application.get_status_display(),

                    "event_date":
                        event["date"],

                    "subject":
                        event["subject"],
                }
            )

        timeline.sort(
            key=lambda item:
                item["event_date"],
            reverse=True,
        )

        return timeline[:20]