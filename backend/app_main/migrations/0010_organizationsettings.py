from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0009_documentcalculationcategory_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrganizationSettings",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("institute_director", models.CharField(blank=True, default="", max_length=255, verbose_name="Institut direktori")),
                ("deputy_minister", models.CharField(blank=True, default="", max_length=255, verbose_name="Vazir o'rin bosari")),
                ("economics_head", models.CharField(blank=True, default="", max_length=255, verbose_name="Iqtisod bo'lim boshlig'i")),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Tashkilot sozlamalari",
                "verbose_name_plural": "Tashkilot sozlamalari",
            },
        ),
    ]
