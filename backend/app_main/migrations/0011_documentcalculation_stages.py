from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0010_organizationsettings"),
    ]

    operations = [
        migrations.AddField(
            model_name="documentcalculation",
            name="stage1_start",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="I bosqich boshlanishi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage1_end",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="I bosqich tugashi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage1_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=18, verbose_name="I bosqich summasi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage2_start",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="II bosqich boshlanishi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage2_end",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="II bosqich tugashi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage2_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=18, verbose_name="II bosqich summasi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage3_start",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="III bosqich boshlanishi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage3_end",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="III bosqich tugashi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage3_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=18, verbose_name="III bosqich summasi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage4_start",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="IV bosqich boshlanishi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage4_end",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="IV bosqich tugashi"),
        ),
        migrations.AddField(
            model_name="documentcalculation",
            name="stage4_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=18, verbose_name="IV bosqich summasi"),
        ),
    ]
