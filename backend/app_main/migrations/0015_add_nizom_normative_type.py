from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0014_remove_staff_add_designation"),
    ]

    operations = [
        migrations.AlterField(
            model_name="normativecoefficient",
            name="normative_type",
            field=models.CharField(
                choices=[
                    ("technical_regulation", "Technical regulation"),
                    ("shnq", "SHNQ"),
                    ("eurocode", "Eurocode"),
                    ("standard", "Standard"),
                    ("srn", "SRN"),
                    ("qr", "QR"),
                    ("mqn", "MQN"),
                    ("methodical_guide", "Methodical guide"),
                    ("nizom", "Nizom"),
                ],
                max_length=64,
                unique=True,
                verbose_name="Normativ turi",
            ),
        ),
        migrations.AlterField(
            model_name="documentcalculation",
            name="normative_type",
            field=models.CharField(
                choices=[
                    ("technical_regulation", "Technical regulation"),
                    ("shnq", "SHNQ"),
                    ("eurocode", "Eurocode"),
                    ("standard", "Standard"),
                    ("srn", "SRN"),
                    ("qr", "QR"),
                    ("mqn", "MQN"),
                    ("methodical_guide", "Methodical guide"),
                    ("nizom", "Nizom"),
                ],
                max_length=64,
                verbose_name="Normativ turi",
            ),
        ),
    ]
