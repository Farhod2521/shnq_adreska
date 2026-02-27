from django.urls import path

from .views import (
    DashboardStatsAPIView,
    DocumentCalculationCategoryListAPIView,
    DocumentCalculationListCreateAPIView,
    DocumentCalculationRetrieveUpdateDestroyAPIView,
    DocumentCalculationXlsxImportAPIView,
    HealthCheckAPIView,
    NormativeCoefficientListAPIView,
    StaffCompositionListAPIView,
)


app_name = "app_main"

urlpatterns = [
    path("health/", HealthCheckAPIView.as_view(), name="health"),
    path("dashboard-stats/", DashboardStatsAPIView.as_view(), name="dashboard-stats"),
    path("normative-coefficients/", NormativeCoefficientListAPIView.as_view(), name="normative-coefficients"),
    path("staff-compositions/", StaffCompositionListAPIView.as_view(), name="staff-compositions"),
    path(
        "document-calculation-categories/",
        DocumentCalculationCategoryListAPIView.as_view(),
        name="document-calculation-categories",
    ),
    path("document-calculations/", DocumentCalculationListCreateAPIView.as_view(), name="document-calculations"),
    path(
        "document-calculations/import-xlsx/",
        DocumentCalculationXlsxImportAPIView.as_view(),
        name="document-calculations-import-xlsx",
    ),
    path(
        "document-calculations/<int:pk>/",
        DocumentCalculationRetrieveUpdateDestroyAPIView.as_view(),
        name="document-calculation-detail",
    ),
]
