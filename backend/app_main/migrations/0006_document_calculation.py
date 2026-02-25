from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app_main", "0005_alter_normativecoefficient_options_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="DocumentCalculation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=500, verbose_name="Hujjat nomi")),
                ("total_pages", models.PositiveIntegerField(default=0, verbose_name="Umumiy sahifalar soni")),
                (
                    "normative_type",
                    models.CharField(
                        choices=[
                            ("technical_regulation", "Technical regulation"),
                            ("shnq", "SHNQ"),
                            ("eurocode", "Eurocode"),
                            ("standard_srn_qr_mqn", "Standard/SRN/QR/MQN"),
                            ("methodical_guide", "Methodical guide"),
                        ],
                        max_length=64,
                        verbose_name="Normativ turi",
                    ),
                ),
                (
                    "document_category",
                    models.CharField(
                        choices=[
                            ("new", "Yangi"),
                            ("rework_harmonization", "Qayta ishlash: uyg'unlashtirish"),
                            ("rework_modification", "Qayta ishlash: muvofiqlashtirish"),
                            ("additional_change", "Qo'shimcha o'zgartirish"),
                        ],
                        max_length=32,
                        verbose_name="Hujjat toifasi",
                    ),
                ),
                (
                    "complexity_level",
                    models.CharField(
                        choices=[("1", "I toifa"), ("2", "II toifa"), ("3", "III toifa")],
                        default="1",
                        max_length=1,
                        verbose_name="Murakkablik toifasi",
                    ),
                ),
                (
                    "selected_base_coefficient",
                    models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Tanlangan bazaviy koeffitsient'),
                ),
                (
                    "selected_complexity_coefficient",
                    models.DecimalField(decimal_places=2, default=1, max_digits=6, verbose_name='Tanlangan murakkablik koeffitsienti'),
                ),
                ("staff_snapshot", models.JSONField(blank=True, default=list, verbose_name='Xodimlar snapshot (JSON)')),
                (
                    "staff_total_amount",
                    models.DecimalField(decimal_places=2, default=0, max_digits=16, verbose_name="Xodimlar bo'yicha jami summa"),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")),
            ],
            options={
                "verbose_name": "Hujjat hisobi",
                "verbose_name_plural": "Hujjatlar hisobi",
                "ordering": ["-id"],
            },
        ),
    ]

