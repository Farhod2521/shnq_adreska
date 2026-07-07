from rest_framework import serializers

from .models import (
    DocumentCalculation,
    DocumentCalculationCategory,
    NormativeCoefficient,
    OrganizationSettings,
)


class HealthCheckSerializer(serializers.Serializer):
    message = serializers.CharField()
    service = serializers.CharField()
    status = serializers.CharField()


class NormativeCoefficientSerializer(serializers.ModelSerializer):
    normative_type_label = serializers.CharField(source="get_normative_type_display", read_only=True)

    class Meta:
        model = NormativeCoefficient
        fields = [
            "id",
            "normative_type",
            "normative_type_label",
            "new_document_base",
            "new_document_base_2",
            "new_document_base_3",
            "rework_harmonization_base",
            "rework_harmonization_base_2",
            "rework_harmonization_base_3",
            "rework_modification_base",
            "additional_change_base",
            "additional_change_base_2",
            "additional_change_base_3",
            "complexity_level_1",
            "complexity_level_2",
            "complexity_level_3",
        ]


class DocumentCalculationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentCalculationCategory
        fields = ["id", "name"]


class DocumentCalculationSerializer(serializers.ModelSerializer):
    calculation_category_name = serializers.CharField(source="calculation_category.name", read_only=True)

    class Meta:
        model = DocumentCalculation
        fields = [
            "id",
            "designation",
            "name",
            "total_pages",
            "normative_type",
            "document_category",
            "calculation_category",
            "calculation_category_name",
            "complexity_level",
            "sources_count",
            "is_research_required",
            "selected_base_coefficient",
            "selected_complexity_coefficient",
            "final_total_amount",
            "completed_amount",
            "planned_amount",
            "stage1_start",
            "stage1_end",
            "stage1_amount",
            "stage2_start",
            "stage2_end",
            "stage2_amount",
            "stage3_start",
            "stage3_end",
            "stage3_amount",
            "stage4_start",
            "stage4_end",
            "stage4_amount",
            "current_year_percent",
            "development_deadline",
            "executor_organization",
            "contract_number",
            "notes",
            "created_at",
            "updated_at",
        ]


class DocumentCalculationCreateSerializer(serializers.Serializer):
    designation = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    name = serializers.CharField(max_length=500)
    total_pages = serializers.IntegerField(min_value=1)
    normative_type = serializers.ChoiceField(choices=NormativeCoefficient.NormativeType.choices)
    document_category = serializers.ChoiceField(choices=DocumentCalculation.DocumentCategory.choices)
    calculation_category = serializers.PrimaryKeyRelatedField(
        queryset=DocumentCalculationCategory.objects.all(), required=False, allow_null=True
    )
    complexity_level = serializers.ChoiceField(choices=DocumentCalculation.ComplexityLevel.choices)
    sources_count = serializers.IntegerField(min_value=0, required=False, default=0)
    is_research_required = serializers.BooleanField(required=False, default=False)
    # VHM qiymati — 12-jadvaldan frontend hisoblaydi va yuboradi
    selected_base_coefficient = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default="0.00"
    )
    # default yo'q — yuborilmasa Sheets'dan kelgan qiymat saqlanib qoladi (2026/2027 hisobi uchun muhim)
    completed_amount = serializers.DecimalField(
        max_digits=18, decimal_places=2, required=False
    )
    planned_amount = serializers.DecimalField(
        max_digits=18, decimal_places=2, required=False
    )
    stage1_start = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    stage1_end = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    stage1_amount = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, default="0.00")
    stage2_start = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    stage2_end = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    stage2_amount = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, default="0.00")
    stage3_start = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    stage3_end = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    stage3_amount = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, default="0.00")
    stage4_start = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    stage4_end = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    stage4_amount = serializers.DecimalField(max_digits=18, decimal_places=2, required=False, default="0.00")
    current_year_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default="0.00")
    development_deadline = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    executor_organization = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    contract_number = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        normative_type = attrs.get("normative_type")
        if normative_type is None and self.instance is not None:
            normative_type = self.instance.normative_type
        if normative_type is None:
            raise serializers.ValidationError({"normative_type": "Hujjat turi majburiy."})

        matrix_exists = NormativeCoefficient.objects.filter(
            normative_type=normative_type,
            is_active=True,
        ).exists()
        if not matrix_exists:
            raise serializers.ValidationError(
                {"normative_type": "Tanlangan hujjat turi uchun faol koeffitsient topilmadi."}
            )
        return attrs

    def create(self, validated_data):
        instance = DocumentCalculation.objects.create(**validated_data)
        instance.recalculate_final_total_amount()
        instance.save(update_fields=["final_total_amount", "updated_at"])
        return instance

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.recalculate_final_total_amount()
        instance.save()
        return instance


class OrganizationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationSettings
        fields = ["institute_director", "deputy_minister", "economics_head", "updated_at"]
        read_only_fields = ["updated_at"]
