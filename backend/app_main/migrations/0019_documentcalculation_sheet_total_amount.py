from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0018_amount_precision_3"),
    ]

    operations = [
        migrations.AddField(
            model_name="documentcalculation",
            name="sheet_total_amount",
            field=models.DecimalField(
                max_digits=18,
                decimal_places=3,
                default=0,
                verbose_name="Excel umumiy narxi (ming so'm)",
            ),
        ),
    ]
