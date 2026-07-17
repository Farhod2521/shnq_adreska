from django.urls import path

from .views import (
    DashboardStatsAPIView,
    DocumentCalculationCategoryListAPIView,
    DocumentCalculationListCreateAPIView,
    DocumentCalculationReportTableAPIView,
    DocumentCalculationRetrieveUpdateDestroyAPIView,
    DocumentCalculationXlsxImportAPIView,
    DocumentBayonnomaAPIView,
    DocumentBayonnomaBulkAPIView,
    DocumentContractAPIView,
    DocumentContractBulkAPIView,
    DocumentKalkulatsiyaAPIView,
    DocumentKalkulatsiyaBulkAPIView,
    DocumentKalendarRejaAPIView,
    DocumentKalendarRejaBulkAPIView,
    DocumentTexnikTopshiriqAPIView,
    DocumentTexnikTopshiriqBulkAPIView,
    HealthCheckAPIView,
    NormativeCoefficientListAPIView,
    OrganizationSettingsAPIView,
    SyncFromSheetsAPIView,
)


app_name = "app_main"

urlpatterns = [
    path("health/", HealthCheckAPIView.as_view(), name="health"),
    path("dashboard-stats/", DashboardStatsAPIView.as_view(), name="dashboard-stats"),
    path("normative-coefficients/", NormativeCoefficientListAPIView.as_view(), name="normative-coefficients"),
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
        "document-calculations/<int:pk>/bayonnoma/",
        DocumentBayonnomaAPIView.as_view(),
        name="document-calculation-bayonnoma",
    ),
    path(
        "document-calculations/<int:pk>/kalkulatsiya/",
        DocumentKalkulatsiyaAPIView.as_view(),
        name="document-calculation-kalkulatsiya",
    ),
    path(
        "document-calculations/kalkulatsiya-bulk/",
        DocumentKalkulatsiyaBulkAPIView.as_view(),
        name="document-calculation-kalkulatsiya-bulk",
    ),
    path(
        "document-calculations/shartnoma-bulk/",
        DocumentContractBulkAPIView.as_view(),
        name="document-calculation-shartnoma-bulk",
    ),
    path(
        "document-calculations/kalendar-reja-bulk/",
        DocumentKalendarRejaBulkAPIView.as_view(),
        name="document-calculation-kalendar-reja-bulk",
    ),
    path(
        "document-calculations/texnik-topshiriq-bulk/",
        DocumentTexnikTopshiriqBulkAPIView.as_view(),
        name="document-calculation-texnik-topshiriq-bulk",
    ),
    path(
        "document-calculations/bayonnoma-bulk/",
        DocumentBayonnomaBulkAPIView.as_view(),
        name="document-calculation-bayonnoma-bulk",
    ),
    path(
        "organization-settings/",
        OrganizationSettingsAPIView.as_view(),
        name="organization-settings",
    ),
    path(
        "sync-sheets/",
        SyncFromSheetsAPIView.as_view(),
        name="sync-sheets",
    ),
]
