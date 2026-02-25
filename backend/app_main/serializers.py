from rest_framework import serializers

from .models import DocumentCalculation, NormativeCoefficient, StaffComposition


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


class DocumentCalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentCalculation
        fields = [
            "id",
            "name",
            "total_pages",
            "normative_type",
            "document_category",
            "complexity_level",
            "is_research_required",
            "selected_base_coefficient",
            "selected_complexity_coefficient",
            "staff_snapshot",
            "staff_total_amount",
            "final_total_amount",
            "created_at",
            "updated_at",
        ]


class DocumentCalculationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=500)
    total_pages = serializers.IntegerField(min_value=1)
    normative_type = serializers.ChoiceField(choices=NormativeCoefficient.NormativeType.choices)
    document_category = serializers.ChoiceField(choices=DocumentCalculation.DocumentCategory.choices)
    complexity_level = serializers.ChoiceField(choices=DocumentCalculation.ComplexityLevel.choices)
    is_research_required = serializers.BooleanField(required=False, default=False)
    staff_counts = serializers.DictField(child=serializers.IntegerField(min_value=0), required=False)

    def validate(self, attrs):
        matrix_exists = NormativeCoefficient.objects.filter(
            normative_type=attrs["normative_type"],
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

