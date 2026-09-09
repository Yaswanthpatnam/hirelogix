from django.urls import path

from .views import (
    JobApplicationDetailView,
    JobApplicationListView,
    JobApplicationSummaryView,
)


urlpatterns = [
    path(
        "",
        JobApplicationListView.as_view(),
        name="job-application-list",
    ),
    path(
        "summary/",
        JobApplicationSummaryView.as_view(),
        name="job-application-summary",
    ),
    path(
        "<int:pk>/",
        JobApplicationDetailView.as_view(),
        name="job-application-detail",
    ),
]