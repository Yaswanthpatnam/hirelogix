from django.db.models import Q

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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


class JobApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(
            user=self.request.user,
        )


class JobApplicationSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = JobApplication.objects.filter(
            user=request.user,
        )

        return Response(
            {
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
        )