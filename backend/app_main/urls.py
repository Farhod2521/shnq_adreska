from django.urls import path

from .views import (
    DashboardStatsAPIView,
    DocumentCalculationCategoryListAPIView,
    DocumentCalculationListCreateAPIView,
    DocumentCalculationReportTableAPIView,
    DocumentCalculationRetrieveUpdateDestroyAPIView,
    DocumentCalculationXlsxImportAPIView,
    DocumentContractAPIView,
    DocumentKalendarRejaAPIView,
    DocumentTexnikTopshiriqAPIView,
    HealthCheckAPIView,
    NormativeCoefficientListAPIView,
    OrganizationSettingsAPIView,
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
        "document-calculations/report-table/",
        DocumentCalculationReportTableAPIView.as_view(),
        name="document-calculations-report-table",
    ),
    path(
        "document-calculations/<int:pk>/",
        DocumentCalculationRetrieveUpdateDestroyAPIView.as_view(),
        name="document-calculation-detail",
    ),
    path(
        "document-calculations/<int:pk>/contract/",
        DocumentContractAPIView.as_view(),
        name="document-calculation-contract",
    ),
    path(
        "document-calculations/<int:pk>/kalendar-reja/",
        DocumentKalendarRejaAPIView.as_view(),
        name="document-calculation-kalendar-reja",
    ),
    path(
        "document-calculations/<int:pk>/texnik-topshiriq/",
        DocumentTexnikTopshiriqAPIView.as_view(),
        name="document-calculation-texnik-topshiriq",
    ),
    path(
        "organization-settings/",
        OrganizationSettingsAPIView.as_view(),
        name="organization-settings",
    ),
]
