"""
Add per-complexity VHM fields to NormativeCoefficient and reseed all 9 types
with correct values from Metodika (Меҳнат сарфи) table.
"""
from django.db import migrations, models


# Metodika 12-jadvali: (new_I, new_II, new_III, rework_I, rework_II, rework_III, change_I, change_II, change_III)
CORRECT_COEFFICIENTS = {
    "technical_regulation": (15, 28, 43,  8, 14, 22,  3,  5,  7),
    "shnq":                 (14, 26, 40,  7, 13, 20,  2,  4,  7),
    "mqn":                  (14, 26, 40,  7, 13, 20,  2,  4,  7),
    "eurocode":             (13, 24, 37,  7, 12, 19,  2,  4,  6),
    "nizom":                (12, 23, 34,  6, 12, 17,  2,  4,  6),
    "standard":             (11, 21, 32,  6, 11, 16,  2,  4,  5),
    "srn":                  (11, 21, 32,  6, 11, 16,  2,  4,  5),
    "qr":                   (11, 21, 32,  6, 11, 16,  2,  4,  5),
    "methodical_guide":     (10, 19, 29,  5, 10, 15,  2,  3,  5),
}


def reseed_coefficients(apps, schema_editor):
    NormativeCoefficient = apps.get_model("app_main", "NormativeCoefficient")

    # invalid eski yozuvni o'chirish
    NormativeCoefficient.objects.filter(normative_type="standard_srn_qr_mqn").delete()

    for norm_type, vals in CORRECT_COEFFICIENTS.items():
        n1, n2, n3, r1, r2, r3, c1, c2, c3 = vals
        NormativeCoefficient.objects.update_or_create(
            normative_type=norm_type,
            defaults={
                "new_document_base":         n1,
                "new_document_base_2":       n2,
                "new_document_base_3":       n3,
                "rework_harmonization_base":   r1,
                "rework_harmonization_base_2": r2,
                "rework_harmonization_base_3": r3,
                "rework_modification_base":  r1,
                "additional_change_base":    c1,
                "additional_change_base_2":  c2,
                "additional_change_base_3":  c3,
                "complexity_level_1": "1.00",
                "complexity_level_2": "1.00",
                "complexity_level_3": "1.00",
                "is_active": True,
            },
        )


def reverse_reseed(apps, schema_editor):
    NormativeCoefficient = apps.get_model("app_main", "NormativeCoefficient")
    NormativeCoefficient.objects.filter(
        normative_type__in=list(CORRECT_COEFFICIENTS.keys())
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0015_add_nizom_normative_type"),
    ]

    operations = [
        # 1. Yangi maydonlar qo'shish
        migrations.AddField(
            model_name="normativecoefficient",
            name="new_document_base_2",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name="Yangi II toifa"),
        ),
        migrations.AddField(
            model_name="normativecoefficient",
            name="new_document_base_3",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name="Yangi III toifa"),
        ),
        migrations.AddField(
            model_name="normativecoefficient",
            name="rework_harmonization_base_2",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name="Qayta ishlash II toifa"),
        ),
        migrations.AddField(
            model_name="normativecoefficient",
            name="rework_harmonization_base_3",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name="Qayta ishlash III toifa"),
        ),
        migrations.AddField(
            model_name="normativecoefficient",
            name="additional_change_base_2",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name="O'zgartirish II toifa"),
        ),
        migrations.AddField(
            model_name="normativecoefficient",
            name="additional_change_base_3",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name="O'zgartirish III toifa"),
        ),
        # 2. To'g'ri qiymatlar bilan to'ldirish
        migrations.RunPython(reseed_coefficients, reverse_reseed),
    ]
