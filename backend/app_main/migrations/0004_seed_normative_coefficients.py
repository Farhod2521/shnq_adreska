from django.db import migrations


def seed_normative_coefficients(apps, schema_editor):
    NormativeCoefficient = apps.get_model("app_main", "NormativeCoefficient")

    rows = [
        {
            "normative_type": "technical_regulation",
            "new_document_base": "4.00",
            "rework_harmonization_base": "6.00",
            "rework_modification_base": "8.00",
            "additional_change_base": "10.00",
            "complexity_level_1": "1.00",
            "complexity_level_2": "1.10",
            "complexity_level_3": "1.20",
        },
        {
            "normative_type": "shnq",
            "new_document_base": "6.00",
            "rework_harmonization_base": "8.00",
            "rework_modification_base": "10.00",
            "additional_change_base": "12.00",
            "complexity_level_1": "1.00",
            "complexity_level_2": "1.10",
            "complexity_level_3": "1.20",
        },
        {
            "normative_type": "eurocode",
            "new_document_base": "8.00",
            "rework_harmonization_base": "10.00",
            "rework_modification_base": "12.00",
            "additional_change_base": "14.00",
            "complexity_level_1": "1.00",
            "complexity_level_2": "1.10",
            "complexity_level_3": "1.20",
        },
        {
            "normative_type": "standard_srn_qr_mqn",
            "new_document_base": "10.00",
            "rework_harmonization_base": "12.00",
            "rework_modification_base": "14.00",
            "additional_change_base": "16.00",
            "complexity_level_1": "1.00",
            "complexity_level_2": "1.10",
            "complexity_level_3": "1.20",
        },
        {
            "normative_type": "methodical_guide",
            "new_document_base": "12.00",
            "rework_harmonization_base": "14.00",
            "rework_modification_base": "16.00",
            "additional_change_base": "18.00",
            "complexity_level_1": "1.00",
            "complexity_level_2": "1.10",
            "complexity_level_3": "1.20",
        },
    ]

    for row in rows:
        NormativeCoefficient.objects.update_or_create(
            normative_type=row["normative_type"],
            defaults=row,
        )


def unseed_normative_coefficients(apps, schema_editor):
    NormativeCoefficient = apps.get_model("app_main", "NormativeCoefficient")
    types = [
        "technical_regulation",
        "shnq",
        "eurocode",
        "standard_srn_qr_mqn",
        "methodical_guide",
    ]
    NormativeCoefficient.objects.filter(normative_type__in=types).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("app_main", "0003_normative_coefficient"),
    ]

    operations = [
        migrations.RunPython(seed_normative_coefficients, unseed_normative_coefficients),
    ]

