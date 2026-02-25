from decimal import Decimal, ROUND_HALF_UP

from django.db import models


class StaffComposition(models.Model):
    name = models.CharField(max_length=255, verbose_name="Nomi")
    coefficient = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Koeffitsient")
    mrot = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="MROT")
    sort_order = models.PositiveSmallIntegerField(default=1, verbose_name="Tartib raqami")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Xodim tarkibi"
        verbose_name_plural = "Xodimlar tarkibi"

    def __str__(self) -> str:
        return self.name


class NormativeCoefficient(models.Model):
    class NormativeType(models.TextChoices):
        TECHNICAL_REGULATION = "technical_regulation", "Technical regulation"
        SHNQ = "shnq", "SHNQ"
        EUROCODE = "eurocode", "Eurocode"
        STANDARD = "standard", "Standard"
        SRN = "srn", "SRN"
        QR_MQN = "qr", "QR"
        MQN = "mqn", "MQN"
        METHODICAL_GUIDE = "methodical_guide", "Methodical guide"

    normative_type = models.CharField(
        max_length=64,
        choices=NormativeType.choices,
        unique=True,
        verbose_name="Normativ turi",
    )

    new_document_base = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Yangi (bet/oy)")
    rework_harmonization_base = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Qayta ishlash: uyg'unlashtirish (bet)"
    )
    rework_modification_base = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Qayta ishlash: muvofiqlashtirish (bet)"
    )
    additional_change_base = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Qo'shimcha o'zgartirish (bet)"
    )

    complexity_level_1 = models.DecimalField(max_digits=6, decimal_places=2, default=1.00, verbose_name="I toifa")
    complexity_level_2 = models.DecimalField(max_digits=6, decimal_places=2, default=1.10, verbose_name="II toifa")
    complexity_level_3 = models.DecimalField(max_digits=6, decimal_places=2, default=1.20, verbose_name="III toifa")

    is_active = models.BooleanField(default=True, verbose_name="Faol")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")

    class Meta:
        ordering = ["normative_type"]
        verbose_name = "Normativ koeffitsient"
        verbose_name_plural = "Normativ koeffitsientlar"

    def __str__(self) -> str:
        return self.get_normative_type_display()


class DocumentCalculation(models.Model):
    class DocumentCategory(models.TextChoices):
        NEW = "new", "Yangi"
        REWORK_HARMONIZATION = "rework_harmonization", "Qayta ishlash: uyg'unlashtirish"
        REWORK_MODIFICATION = "rework_modification", "Qayta ishlash: muvofiqlashtirish"
        ADDITIONAL_CHANGE = "additional_change", "Qo'shimcha o'zgartirish"

    class ComplexityLevel(models.TextChoices):
        LEVEL_1 = "1", "I toifa"
        LEVEL_2 = "2", "II toifa"
        LEVEL_3 = "3", "III toifa"

    name = models.CharField(max_length=500, verbose_name="Hujjat nomi")
    total_pages = models.PositiveIntegerField(default=0, verbose_name="Umumiy sahifalar soni")
    normative_type = models.CharField(
        max_length=64,
        choices=NormativeCoefficient.NormativeType.choices,
        verbose_name="Normativ turi",
    )
    document_category = models.CharField(
        max_length=32,
        choices=DocumentCategory.choices,
        verbose_name="Hujjat toifasi",
    )
    complexity_level = models.CharField(
        max_length=1,
        choices=ComplexityLevel.choices,
        default=ComplexityLevel.LEVEL_1,
        verbose_name="Murakkablik toifasi",
    )

    selected_base_coefficient = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Tanlangan bazaviy koeffitsient",
    )
    selected_complexity_coefficient = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=1,
        verbose_name="Tanlangan murakkablik koeffitsienti",
    )
    is_research_required = models.BooleanField(
        default=False,
        verbose_name="Tadqiqot o'tkazilishi belgilangan normativ hujjatmi?",
    )

    staff_snapshot = models.JSONField(default=list, blank=True, verbose_name="Xodimlar snapshot (JSON)")
    staff_total_amount = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0,
        verbose_name="Xodimlar bo'yicha jami summa",
    )
    final_total_amount = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0,
        verbose_name="Yakuniy hisoblangan summa",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")

    class Meta:
        ordering = ["-id"]
        verbose_name = "Hujjat hisobi"
        verbose_name_plural = "Hujjatlar hisobi"

    def __str__(self) -> str:
        return self.name

    def apply_normative_coefficients(self) -> None:
        matrix = NormativeCoefficient.objects.filter(
            normative_type=self.normative_type,
            is_active=True,
        ).first()
        if not matrix:
            return

        category_to_base = {
            self.DocumentCategory.NEW: matrix.new_document_base,
            self.DocumentCategory.REWORK_HARMONIZATION: matrix.rework_harmonization_base,
            self.DocumentCategory.REWORK_MODIFICATION: matrix.rework_modification_base,
            self.DocumentCategory.ADDITIONAL_CHANGE: matrix.additional_change_base,
        }
        level_to_complexity = {
            self.ComplexityLevel.LEVEL_1: matrix.complexity_level_1,
            self.ComplexityLevel.LEVEL_2: matrix.complexity_level_2,
            self.ComplexityLevel.LEVEL_3: matrix.complexity_level_3,
        }

        self.selected_base_coefficient = category_to_base.get(self.document_category, Decimal("0.00"))
        self.selected_complexity_coefficient = level_to_complexity.get(
            self.complexity_level,
            Decimal("1.00"),
        )

    def build_staff_snapshot(self, staff_counts: dict[str, int]) -> list[dict]:
        snapshot: list[dict] = []
        total = Decimal("0.00")

        for staff in StaffComposition.objects.filter(is_active=True).order_by("sort_order", "id"):
            count = int(staff_counts.get(str(staff.id), staff_counts.get(staff.name, 0)) or 0)
            amount = (Decimal(count) * staff.coefficient * staff.mrot).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            total += amount
            snapshot.append(
                {
                    "staff_id": staff.id,
                    "name": staff.name,
                    "employee_count": count,
                    "coefficient": str(staff.coefficient),
                    "mrot": str(staff.mrot),
                    "amount": str(amount),
                }
            )

        self.staff_snapshot = snapshot
        self.staff_total_amount = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return snapshot

    def recalculate_final_total_amount(self) -> Decimal:
        if self.selected_base_coefficient <= 0 or self.total_pages <= 0:
            self.final_total_amount = Decimal("0.00")
            return self.final_total_amount

        page_ratio = Decimal(self.total_pages) / self.selected_base_coefficient
        result = (
            self.staff_total_amount
            * page_ratio
            * self.selected_complexity_coefficient
            * Decimal("2.30")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.final_total_amount = result
        return result
