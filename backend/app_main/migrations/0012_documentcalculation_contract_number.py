from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0011_documentcalculation_stages"),
    ]

    operations = [
        migrations.AddField(
            model_name="documentcalculation",
            name="contract_number",
            field=models.CharField(blank=True, default="", max_length=255, verbose_name="Shartnoma raqami"),
        ),
    ]
