from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0016_normative_coefficient_complexity_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="documentcalculation",
            name="sources_count",
            field=models.PositiveIntegerField(default=0, verbose_name="Foydalanilgan manbalar soni"),
        ),
    ]
