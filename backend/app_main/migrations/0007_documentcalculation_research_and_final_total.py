from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app_main", "0006_document_calculation"),
    ]

    operations = [
        migrations.AddField(
            model_name="documentcalculation",
            name="final_total_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=18,
                verbose_name="Yakuniy hisoblangan summa",
            ),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="is_research_required",
            field=models.BooleanField(
                default=False,
                verbose_name="Tadqiqot o'tkazilishi belgilangan normativ hujjatmi?",
            ),
        ),
    ]

