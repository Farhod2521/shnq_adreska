from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0019_documentcalculation_sheet_total_amount"),
    ]

    operations = [
        migrations.AddField(
            model_name="organizationsettings",
            name="base_calculation_amount",
            field=models.DecimalField(
                max_digits=14,
                decimal_places=2,
                default=Decimal("412000"),
                verbose_name="BHM (bazaviy hisoblash miqdori)",
            ),
        ),
    ]
