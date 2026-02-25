from django.db import migrations


def seed_staff_composition(apps, schema_editor):
    StaffComposition = apps.get_model("app_main", "StaffComposition")

    rows = [
        {"name": "Loyiha rahbari", "coefficient": "8.41", "mrot": "1271000.00", "sort_order": 1},
        {"name": "Yetakchi ilmiy xodim", "coefficient": "6.87", "mrot": "1271000.00", "sort_order": 3},
        {"name": "Katta ilmiy xodim", "coefficient": "6.05", "mrot": "1271000.00", "sort_order": 4},
        {"name": "Kichik ilmiy xodim", "coefficient": "5.79", "mrot": "1271000.00", "sort_order": 5},
        {"name": "Soha ekspertlari", "coefficient": "4.76", "mrot": "1271000.00", "sort_order": 6},
        {"name": "Texnik/stajer tadqiqotchi", "coefficient": "4.76", "mrot": "1271000.00", "sort_order": 7},
    ]

    for row in rows:
        StaffComposition.objects.update_or_create(
            name=row["name"],
            defaults={
                "coefficient": row["coefficient"],
                "mrot": row["mrot"],
                "sort_order": row["sort_order"],
                "is_active": True,
            },
        )


def unseed_staff_composition(apps, schema_editor):
    StaffComposition = apps.get_model("app_main", "StaffComposition")
    names = [
        "Loyiha rahbari",
        "Yetakchi ilmiy xodim",
        "Katta ilmiy xodim",
        "Kichik ilmiy xodim",
        "Soha ekspertlari",
        "Texnik/stajer tadqiqotchi",
    ]
    StaffComposition.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("app_main", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_staff_composition, unseed_staff_composition),
    ]

