from rest_framework import serializers

from .models import (
    DocumentCalculation,
    DocumentCalculationCategory,
    NormativeCoefficient,
    StaffComposition,
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
            "rework_harmonization_base",
            "rework_modification_base",
            "additional_change_base",
            "complexity_level_1",
            "complexity_level_2",
            "complexity_level_3",
        ]


class StaffCompositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffComposition
        fields = ["id", "name", "coefficient", "mrot", "sort_order"]


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
            "name",
            "total_pages",
            "normative_type",
            "document_category",
            "calculation_category",
            "calculation_category_name",
            "complexity_level",
            "is_research_required",
            "selected_base_coefficient",
            "selected_complexity_coefficient",
            "staff_snapshot",
            "staff_total_amount",
            "final_total_amount",
            "completed_amount",
            "planned_amount",
            "development_deadline",
            "executor_organization",
            "notes",
            "created_at",
            "updated_at",
        ]


class DocumentCalculationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=500)
    total_pages = serializers.IntegerField(min_value=1)
    normative_type = serializers.ChoiceField(choices=NormativeCoefficient.NormativeType.choices)
    document_category = serializers.ChoiceField(choices=DocumentCalculation.DocumentCategory.choices)
    calculation_category = serializers.PrimaryKeyRelatedField(
        queryset=DocumentCalculationCategory.objects.all(), required=False, allow_null=True
    )
    complexity_level = serializers.ChoiceField(choices=DocumentCalculation.ComplexityLevel.choices)
    is_research_required = serializers.BooleanField(required=False, default=False)
    completed_amount = serializers.DecimalField(
        max_digits=18, decimal_places=2, required=False, default="0.00"
    )
    planned_amount = serializers.DecimalField(
        max_digits=18, decimal_places=2, required=False, default="0.00"
    )
    development_deadline = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    executor_organization = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    staff_counts = serializers.DictField(child=serializers.IntegerField(min_value=0), required=False)

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
        staff_counts = validated_data.pop("staff_counts", {})

        instance = DocumentCalculation.objects.create(**validated_data)
        instance.apply_normative_coefficients()
        instance.build_staff_snapshot(staff_counts=staff_counts)
        instance.recalculate_final_total_amount()
        instance.save(
            update_fields=[
                "selected_base_coefficient",
                "selected_complexity_coefficient",
                "staff_snapshot",
                "staff_total_amount",
                "final_total_amount",
                "updated_at",
            ]
        )
        return instance

    def update(self, instance, validated_data):
        staff_counts = validated_data.pop("staff_counts", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.apply_normative_coefficients()
        if staff_counts is not None:
            instance.build_staff_snapshot(staff_counts=staff_counts)
        instance.recalculate_final_total_amount()
        instance.save()
        return instance
