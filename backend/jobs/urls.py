from django.urls import path
from .views import JobListCreateAPI, JobStageUpdateAPI, JobVerdictAPI,JobFilterAPI,JobDashboardStatsAPI, JobDetailAPI
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", JobListCreateAPI.as_view()),
    path("<int:pk>/", JobDetailAPI.as_view()),
    path("<int:pk>/stage/", JobStageUpdateAPI.as_view()),
    path("<int:pk>/verdict/", JobVerdictAPI.as_view()),
    path("filter/", JobFilterAPI.as_view()),
    path("dashboard/", JobDashboardStatsAPI.as_view()),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)
