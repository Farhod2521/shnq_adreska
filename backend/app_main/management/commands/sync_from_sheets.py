"""
Google Sheets dan ma'lumotlarni bazaga yuklash.

Ishlatish:
    python manage.py sync_from_sheets
    python manage.py sync_from_sheets --dry-run
    python manage.py sync_from_sheets --credentials /path/to/key.json
"""

import os
from decimal import Decimal, InvalidOperation

import gspread
from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.management.color import no_style
from django.db import connection
from google.oauth2.service_account import Credentials

from app_main.models import DocumentCalculation, DocumentCalculationCategory

SPREADSHEET_ID = "1-Ctzg2RPBiSUM-d7Ps74QSNW5mKcG79ZlOrOwdSv9Fg"
SHEET_GID = 558389990

SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

# Холати (document_category) mapping
STATUS_MAP = {
    "я": DocumentCalculation.DocumentCategory.NEW,
    "қ": DocumentCalculation.DocumentCategory.REWORK_HARMONIZATION,
    "ў": DocumentCalculation.DocumentCategory.ADDITIONAL_CHANGE,
}

# Тури (normative_type) mapping
TYPE_MAP = {
    "ш": "shnq",
    "н": "nizom",
    "х": "eurocode",
    "с": "standard",
    "т": "technical_regulation",
    "р": "srn",
}

KNOWN_TYPES = set(TYPE_MAP.keys())

SKIP_NAMES = {"jami", "hammasi", "тaqsimlanmagan limit"}


def _dec(value, default=Decimal("0.00")):
    """Russian number format → Decimal: '2 170 613,760' → Decimal('2170613.76')"""
    if value is None or str(value).strip() in ("", "-", "#REF!"):
        return default
    cleaned = (
        str(value)
        .replace("\xa0", "")   # non-breaking space
        .replace(" ", "")
        .replace(" ", "")
        .replace(",", ".")
    )
    try:
        return Decimal(cleaned).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return default


def _str(value):
    if value is None:
        return ""
    return str(value).strip()


def _is_data_row(row):
    """Haqiqiy hujjat qatori ekanligini tekshiradi."""
    col_n = _str(row[13]).lower()
    col_c = _str(row[2])
    if not col_c or col_n not in KNOWN_TYPES:
        return False
    if col_c.lower().startswith("jami") or col_c.lower() in SKIP_NAMES:
        return False
    return True


class Command(BaseCommand):
    help = "Google Sheets dan hujjatlarni bazaga yuklaydi (eski ma'lumotlar o'chiriladi)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--credentials",
            default=None,
            help="Service account JSON fayl yo'li",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Faqat parsing qilib ko'rsatadi, bazaga yozmayd",
        )

    def handle(self, *args, **options):
        credentials_path = options["credentials"]
        if not credentials_path:
            candidates = [
                # Docker container: /app/credentials.json
                "/app/credentials.json",
                # Local dev: loyiha ildizi (backend/../)
                os.path.join(settings.BASE_DIR.parent, "adreska-246ee-e5b2502b05d5.json"),
                # manage.py yonida
                os.path.join(settings.BASE_DIR, "adreska-246ee-e5b2502b05d5.json"),
            ]
            for candidate in candidates:
                if os.path.exists(candidate):
                    credentials_path = candidate
                    break

        if not credentials_path or not os.path.exists(str(credentials_path)):
            self.stderr.write(self.style.ERROR(
                "Credentials fayl topilmadi. --credentials flag bilan yo'l bering."
            ))
            return

        self.stdout.write(f"Credentials: {credentials_path}")

        try:
            creds = Credentials.from_service_account_file(credentials_path, scopes=SCOPES)
            gc = gspread.authorize(creds)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Google autentifikatsiya xatosi: {e}"))
            return

        self.stdout.write("Google Sheets ga ulanmoqda...")
        try:
            spreadsheet = gc.open_by_key(SPREADSHEET_ID)
            worksheet = None
            for ws in spreadsheet.worksheets():
                if ws.id == SHEET_GID:
                    worksheet = ws
                    break
            if worksheet is None:
                worksheet = spreadsheet.worksheets()[0]
            self.stdout.write(f"Sheet: '{worksheet.title}'")
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Spreadsheet ochishda xato: {e}"))
            return

        self.stdout.write("Ma'lumotlar yuklanmoqda...")
        try:
            all_values = worksheet.get_all_values()
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Ma'lumot o'qishda xato: {e}"))
            return

        self.stdout.write(f"Jami {len(all_values)} qator o'qildi.")
        records = self._parse_rows(all_values)
        self.stdout.write(f"Hujjat qatorlari aniqlandi: {len(records)}")

        if options["dry_run"]:
            self.stdout.write("DRY RUN - bazaga yozilmaydi.")
            for rec in records[:10]:
                self.stdout.write(
                    f"  [{rec['normative_type']:20s}] "
                    f"[{rec['document_category']:25s}] "
                    f"bet={rec['total_pages']:4d} "
                    f"{rec['name'][:50]}"
                )
            self.stdout.write(f"  ... (hammasi {len(records)} ta)")
            return

        self._save_to_db(records)

    def _parse_rows(self, rows):
        records = []
        current_category_name = None

        for row in rows:
            while len(row) < 14:
                row.append("")

            col_a = _str(row[0])
            col_c = _str(row[2])

            # Section header: col A da "bob" bor, qolganlar bo'sh
            if col_a and "bob" in col_a.lower() and not _str(row[1]) and not _str(row[3]):
                current_category_name = col_a
                continue

            if not _is_data_row(row):
                continue

            col_n = _str(row[13]).lower()
            col_k = _str(row[10]).lower()
            col_l = _str(row[11])

            normative_type = TYPE_MAP.get(col_n, "shnq")
            # Hujjat nomi "SRN" bilan boshlansa — turini SRN qilib belgilaymiz
            # (Sheets'dagi harf ba'zan "standard" deb noto'g'ri belgilangan)
            if col_c.upper().lstrip().startswith("SRN"):
                normative_type = "srn"
            document_category = STATUS_MAP.get(col_k, DocumentCalculation.DocumentCategory.NEW)

            try:
                complexity_int = int(float(col_l)) if col_l else 1
            except (ValueError, TypeError):
                complexity_int = 1
            complexity_level = {
                1: DocumentCalculation.ComplexityLevel.LEVEL_1,
                2: DocumentCalculation.ComplexityLevel.LEVEL_2,
                3: DocumentCalculation.ComplexityLevel.LEVEL_3,
            }.get(complexity_int, DocumentCalculation.ComplexityLevel.LEVEL_1)

            try:
                total_pages = int(float(_str(row[9]).replace("\xa0", "").replace(",", "."))) if _str(row[9]) else 0
            except (ValueError, TypeError):
                total_pages = 0

            deadline = _str(row[6]).replace("\n", " ").strip()

            records.append({
                "name": col_c,
                "category_name": current_category_name,
                "normative_type": normative_type,
                "document_category": document_category,
                "complexity_level": complexity_level,
                "total_pages": total_pages,
                "final_total_amount": _dec(row[3]),
                "completed_amount": _dec(row[4]),
                "planned_amount": _dec(row[5]),
                "development_deadline": deadline,
                "executor_organization": _str(row[7]),
                "notes": _str(row[8]),
            })

        return records

    def _save_to_db(self, records):
        self.stdout.write("Eski ma'lumotlar o'chirilmoqda...")
        deleted_count, _ = DocumentCalculation.objects.all().delete()
        self.stdout.write(f"  {deleted_count} ta yozuv o'chirildi.")

        # ID (id) ketma-ketligini 1 dan boshlash — shartnoma raqami id/26 bo'lgani uchun
        try:
            reset_sql = connection.ops.sequence_reset_sql(no_style(), [DocumentCalculation])
            with connection.cursor() as cursor:
                for sql in reset_sql:
                    cursor.execute(sql)
            if reset_sql:
                self.stdout.write("  ID ketma-ketligi 1 dan boshlanadi.")
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(f"  ID ketma-ketligini tiklashda ogohlantirish: {exc}")

        self.stdout.write("Yangi ma'lumotlar yozilmoqda...")
        created = 0
        errors = 0
        category_cache = {}

        for rec in records:
            cat_name = rec.get("category_name")
            category_obj = None
            if cat_name:
                if cat_name not in category_cache:
                    category_obj, _ = DocumentCalculationCategory.objects.get_or_create(name=cat_name)
                    category_cache[cat_name] = category_obj
                else:
                    category_obj = category_cache[cat_name]

            try:
                DocumentCalculation.objects.create(
                    name=rec["name"],
                    calculation_category=category_obj,
                    normative_type=rec["normative_type"],
                    document_category=rec["document_category"],
                    complexity_level=rec["complexity_level"],
                    total_pages=rec["total_pages"],
                    final_total_amount=rec["final_total_amount"],
                    completed_amount=rec["completed_amount"],
                    planned_amount=rec["planned_amount"],
                    development_deadline=rec["development_deadline"],
                    executor_organization=rec["executor_organization"],
                    notes=rec["notes"],
                    selected_base_coefficient=Decimal("0.00"),
                    selected_complexity_coefficient=Decimal("1.00"),
                )
                created += 1
            except Exception as e:
                errors += 1
                self.stderr.write(f"  XATO [{rec['name'][:40]}]: {e}")

        self.stdout.write(f"\nTayyor! Yaratildi: {created} ta, Xatolar: {errors} ta")
