from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0017_documentcalculation_sources_count"),
    ]

    operations = [
        migrations.AlterField(
            model_name="documentcalculation",
            name="completed_amount",
            field=models.DecimalField(
                max_digits=18,
                decimal_places=3,
                default=0,
                verbose_name="01.01.2026 holatiga bajarilgan",
            ),
        ),
        migrations.AlterField(
            model_name="documentcalculation",
            name="planned_amount",
            field=models.DecimalField(
                max_digits=18,
                decimal_places=3,
                default=0,
                verbose_name="2026-yilga rejalashtirilgan",
            ),
        ),
    ]
