from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.utils.dateparse import parse_date
from .pagination import JobPagination
from .models import JobApplication
from .serializers import (
    JobApplicationSerializer,
    StageChangeSerializer,
    VerdictSerializer,
)


class JobListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = JobApplication.objects.filter(
            user=request.user
        ).order_by("-created_at")

        paginator = JobPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = JobApplicationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = JobApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class JobStageUpdateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        job = JobApplication.objects.filter(
            pk=pk, user=request.user
        ).first()
        if not job:
            return Response({"error": "Not found"}, status=404)

        serializer = StageChangeSerializer(
            data=request.data,
            context={"job": job}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Stage updated"})

class JobVerdictAPI(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        job = JobApplication.objects.filter(
            pk=pk, user=request.user
        ).first()
        if not job:
            return Response({"error": "Not found"}, status=404)

        serializer = VerdictSerializer(
            data=request.data,
            context={"job": job}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Verdict updated"})

class JobFilterAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = JobApplication.objects.filter(user=request.user)

        stage = request.query_params.get("stage")
        verdict = request.query_params.get("verdict")
        company = request.query_params.get("company")
        min_salary = request.query_params.get("min_salary")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if stage:
            qs = qs.filter(stage=stage)

        if verdict:
            qs = qs.filter(verdict=verdict)

        if company:
            qs = qs.filter(company__icontains=company)

        if min_salary:
            qs = qs.filter(max_salary__gte=min_salary)

        if start_date and end_date:
            qs = qs.filter(
                applied_date__range=(
                    parse_date(start_date),
                    parse_date(end_date)
                )
            )

        qs = qs.order_by("-created_at")

        paginator = JobPagination()
        page = paginator.paginate_queryset(qs, request)

        serializer = JobApplicationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
class JobDashboardStatsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_jobs = JobApplication.objects.filter(user=request.user)

        active_jobs = user_jobs.filter(verdict__isnull=True)

        return Response({
            "by_stage": list(
                active_jobs
                .values("stage")
                .annotate(count=Count("id"))
            ),
            "by_verdict": list(
                user_jobs
                .filter(verdict__isnull=False)
                .values("verdict")
                .annotate(count=Count("id"))
            ),
        })
        
        
class JobDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        job = JobApplication.objects.filter(
            pk=pk, user=request.user
        ).first()
        if not job:
            return Response({"error": "Not found"}, status=404)
        return Response(JobApplicationSerializer(job).data)

    def delete(self, request, pk):
        job = JobApplication.objects.filter(
            pk=pk, user=request.user
        ).first()
        if not job:
            return Response({"error": "Not found"}, status=404)
        job.delete()
        return Response(status=204)

