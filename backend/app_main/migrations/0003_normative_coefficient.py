from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app_main", "0002_seed_staff_composition_data"),
    ]

    operations = [
        migrations.CreateModel(
            name="NormativeCoefficient",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "normative_type",
                    models.CharField(
                        choices=[
                            ("technical_regulation", "Technical regulation"),
                            ("shnq", "SHNQ"),
                            ("eurocode", "Eurocode"),
                            ("standard_srn_qr_mqn", "Standard/SRN/QR/MQN"),
                            ("methodical_guide", "Methodical guide"),
                        ],
                        max_length=64,
                        unique=True,
                    ),
                ),
                ("new_document_base", models.DecimalField(decimal_places=2, max_digits=10)),
                ("rework_harmonization_base", models.DecimalField(decimal_places=2, max_digits=10)),
                ("rework_modification_base", models.DecimalField(decimal_places=2, max_digits=10)),
                ("additional_change_base", models.DecimalField(decimal_places=2, max_digits=10)),
                ("complexity_level_1", models.DecimalField(decimal_places=2, default=1.0, max_digits=6)),
                ("complexity_level_2", models.DecimalField(decimal_places=2, default=1.1, max_digits=6)),
                ("complexity_level_3", models.DecimalField(decimal_places=2, default=1.2, max_digits=6)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["normative_type"],
            },
        ),
    ]

