from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app_main", "0013_documentcalculation_current_year_percent"),
    ]

    operations = [
        # StaffComposition jadvalini o'chirish
        migrations.DeleteModel(
            name="StaffComposition",
        ),
        # DocumentCalculation modeliga designation qo'shish
        migrations.AddField(
            model_name="documentcalculation",
            name="designation",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="Belgilanishi"),
        ),
        # staff_snapshot maydonini o'chirish
        migrations.RemoveField(
            model_name="documentcalculation",
            name="staff_snapshot",
        ),
        # staff_total_amount maydonini o'chirish
        migrations.RemoveField(
            model_name="documentcalculation",
            name="staff_total_amount",
        ),
        # selected_base_coefficient verbose_name yangilash
        migrations.AlterField(
            model_name="documentcalculation",
            name="selected_base_coefficient",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=10,
                verbose_name="VHM qiymati (12-jadval)",
            ),
        ),
    ]
