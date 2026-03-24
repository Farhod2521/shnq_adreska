from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0012_documentcalculation_contract_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="documentcalculation",
            name="current_year_percent",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5, verbose_name="Joriy yil foizi (%)"),
        ),
    ]
