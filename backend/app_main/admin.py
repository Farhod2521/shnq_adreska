from django.contrib import admin

from .models import DocumentCalculation, NormativeCoefficient, StaffComposition


@admin.register(StaffComposition)
class StaffCompositionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "coefficient", "mrot", "sort_order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(NormativeCoefficient)
class NormativeCoefficientAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "normative_type",
        "new_document_base",
        "rework_harmonization_base",
        "rework_modification_base",
        "additional_change_base",
        "complexity_level_1",
        "complexity_level_2",
        "complexity_level_3",
        "is_active",
    )
    list_filter = ("normative_type", "is_active")


@admin.register(DocumentCalculation)
class DocumentCalculationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "normative_type",
        "document_category",
        "complexity_level",
        "selected_base_coefficient",
        "selected_complexity_coefficient",
        "is_research_required",
        "staff_total_amount",
        "final_total_amount",
        "created_at",
    )
    list_filter = ("normative_type", "document_category", "complexity_level", "is_research_required")
    search_fields = ("name",)
