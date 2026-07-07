from decimal import Decimal, ROUND_HALF_UP

from django.db import models

MROT = Decimal("412000")


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
        NIZOM = "nizom", "Nizom"

    normative_type = models.CharField(
        max_length=64,
        choices=NormativeType.choices,
        unique=True,
        verbose_name="Normativ turi",
    )

    # VHM qiymatlari — Metodika 12-jadvali (Меҳнат сарфи). Har bir toifa uchun alohida.
    new_document_base   = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Yangi I toifa")
    new_document_base_2 = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Yangi II toifa")
    new_document_base_3 = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Yangi III toifa")

    rework_harmonization_base   = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Qayta ishlash I toifa")
    rework_harmonization_base_2 = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Qayta ishlash II toifa")
    rework_harmonization_base_3 = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Qayta ishlash III toifa")

    rework_modification_base = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Qayta ishlash: muvofiqlashtirish (bet)"
    )

    additional_change_base   = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="O'zgartirish I toifa")
    additional_change_base_2 = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="O'zgartirish II toifa")
    additional_change_base_3 = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="O'zgartirish III toifa")

    complexity_level_1 = models.DecimalField(max_digits=6, decimal_places=2, default=1.00, verbose_name="I toifa koeff")
    complexity_level_2 = models.DecimalField(max_digits=6, decimal_places=2, default=1.10, verbose_name="II toifa koeff")
    complexity_level_3 = models.DecimalField(max_digits=6, decimal_places=2, default=1.20, verbose_name="III toifa koeff")

    is_active = models.BooleanField(default=True, verbose_name="Faol")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")

    class Meta:
        ordering = ["normative_type"]
        verbose_name = "Normativ koeffitsient"
        verbose_name_plural = "Normativ koeffitsientlar"

    def __str__(self) -> str:
        return self.get_normative_type_display()


class DocumentCalculationCategory(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name="Kategoriya nomi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")

    class Meta:
        ordering = ["name", "id"]
        verbose_name = "Hujjat hisobi kategoriyasi"
        verbose_name_plural = "Hujjat hisobi kategoriyalari"

    def __str__(self) -> str:
        return self.name


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

    designation = models.CharField(max_length=100, blank=True, default="", verbose_name="Belgilanishi")
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
    calculation_category = models.ForeignKey(
        DocumentCalculationCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="document_calculations",
        verbose_name="Hisob-kitob kategoriyasi",
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
        verbose_name="VHM qiymati (12-jadval)",
    )
    selected_complexity_coefficient = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=1,
        verbose_name="Murakkablik koeffitsienti (saqlangan)",
    )
    sources_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Foydalanilgan manbalar soni",
    )
    is_research_required = models.BooleanField(
        default=False,
        verbose_name="Tadqiqot o'tkazilishi belgilangan normativ hujjatmi?",
    )

    final_total_amount = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=0,
        verbose_name="Yakuniy hisoblangan summa",
    )
    # Excel'dagi umumiy narx (ming so'mda) — MQN/Eurocode uchun formula o'rniga ishlatiladi
    sheet_total_amount = models.DecimalField(
        max_digits=18,
        decimal_places=3,
        default=0,
        verbose_name="Excel umumiy narxi (ming so'm)",
    )
    completed_amount = models.DecimalField(
        max_digits=18,
        decimal_places=3,  # Sheets ming so'mda 3 kasr xona (×1000 aniqligini saqlash uchun)
        default=0,
        verbose_name="01.01.2026 holatiga bajarilgan",
    )
    planned_amount = models.DecimalField(
        max_digits=18,
        decimal_places=3,  # Sheets ming so'mda 3 kasr xona (×1000 aniqligini saqlash uchun)
        default=0,
        verbose_name="2026-yilga rejalashtirilgan",
    )
    current_year_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name="Joriy yil foizi (%)",
    )

    # Kalendar reja — 4 bosqich
    stage1_start = models.CharField(max_length=100, blank=True, default="", verbose_name="I bosqich boshlanishi")
    stage1_end = models.CharField(max_length=100, blank=True, default="", verbose_name="I bosqich tugashi")
    stage1_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name="I bosqich summasi")
    stage2_start = models.CharField(max_length=100, blank=True, default="", verbose_name="II bosqich boshlanishi")
    stage2_end = models.CharField(max_length=100, blank=True, default="", verbose_name="II bosqich tugashi")
    stage2_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name="II bosqich summasi")
    stage3_start = models.CharField(max_length=100, blank=True, default="", verbose_name="III bosqich boshlanishi")
    stage3_end = models.CharField(max_length=100, blank=True, default="", verbose_name="III bosqich tugashi")
    stage3_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name="III bosqich summasi")
    stage4_start = models.CharField(max_length=100, blank=True, default="", verbose_name="IV bosqich boshlanishi")
    stage4_end = models.CharField(max_length=100, blank=True, default="", verbose_name="IV bosqich tugashi")
    stage4_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name="IV bosqich summasi")

    development_deadline = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Ishlab chiqish muddati",
    )
    executor_organization = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Ishni bajaruvchi tashkilot",
    )
    contract_number = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Shartnoma raqami",
    )
    notes = models.TextField(
        blank=True,
        default="",
        verbose_name="Izoh",
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
        """NormativeCoefficient jadvalidan VHM qiymatini (toifa va murakkablikka qarab) oladi."""
        matrix = NormativeCoefficient.objects.filter(
            normative_type=self.normative_type,
            is_active=True,
        ).first()
        if not matrix:
            return

        # (hujjat_toifasi, murakkablik_darajasi) → VHM qiymati (12-jadval)
        lookup = {
            (self.DocumentCategory.NEW, self.ComplexityLevel.LEVEL_1): matrix.new_document_base,
            (self.DocumentCategory.NEW, self.ComplexityLevel.LEVEL_2): matrix.new_document_base_2,
            (self.DocumentCategory.NEW, self.ComplexityLevel.LEVEL_3): matrix.new_document_base_3,
            (self.DocumentCategory.REWORK_HARMONIZATION, self.ComplexityLevel.LEVEL_1): matrix.rework_harmonization_base,
            (self.DocumentCategory.REWORK_HARMONIZATION, self.ComplexityLevel.LEVEL_2): matrix.rework_harmonization_base_2,
            (self.DocumentCategory.REWORK_HARMONIZATION, self.ComplexityLevel.LEVEL_3): matrix.rework_harmonization_base_3,
            (self.DocumentCategory.REWORK_MODIFICATION, self.ComplexityLevel.LEVEL_1): matrix.rework_harmonization_base,
            (self.DocumentCategory.REWORK_MODIFICATION, self.ComplexityLevel.LEVEL_2): matrix.rework_harmonization_base_2,
            (self.DocumentCategory.REWORK_MODIFICATION, self.ComplexityLevel.LEVEL_3): matrix.rework_harmonization_base_3,
            (self.DocumentCategory.ADDITIONAL_CHANGE, self.ComplexityLevel.LEVEL_1): matrix.additional_change_base,
            (self.DocumentCategory.ADDITIONAL_CHANGE, self.ComplexityLevel.LEVEL_2): matrix.additional_change_base_2,
            (self.DocumentCategory.ADDITIONAL_CHANGE, self.ComplexityLevel.LEVEL_3): matrix.additional_change_base_3,
        }
        self.selected_base_coefficient = lookup.get(
            (self.document_category, self.complexity_level), Decimal("0.00")
        )
        self.selected_complexity_coefficient = Decimal("1.00")

    # Umumiy narxi formula bilan emas, Excel'dan to'g'ridan-to'g'ri olinadigan turlar
    SHEET_TOTAL_TYPES = ("mqn", "eurocode")

    def recalculate_final_total_amount(self) -> Decimal:
        """Formula: VHM × sahifalar_soni × BHM(412_000) × 2.1 × 1.12 [× 1.4 agar ilmiy tadqiqot talab etilsa]

        MQN va Eurocode uchun formula boshqacha — umumiy narx Excel'dagi qiymatdan olinadi
        (Sheets ming so'mda saqlaydi → so'mga o'tkazish uchun ×1000).
        """
        if self.normative_type in self.SHEET_TOTAL_TYPES:
            self.final_total_amount = (
                (self.sheet_total_amount or Decimal("0")) * Decimal("1000")
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            return self.final_total_amount

        if self.selected_base_coefficient <= 0 or self.total_pages <= 0:
            self.final_total_amount = Decimal("0.00")
            return self.final_total_amount

        research_factor = Decimal("1.4") if self.is_research_required else Decimal("1")
        result = (
            self.selected_base_coefficient
            * Decimal(self.total_pages)
            * MROT
            * Decimal("2.1")
            * Decimal("1.12")
            * research_factor
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.final_total_amount = result
        return result


class OrganizationSettings(models.Model):
    """Singleton model — tizimda faqat bitta qator bo'ladi (id=1)."""

    institute_director = models.CharField(
        max_length=255, blank=True, default="", verbose_name="Institut direktori"
    )
    deputy_minister = models.CharField(
        max_length=255, blank=True, default="", verbose_name="Vazir o'rin bosari"
    )
    economics_head = models.CharField(
        max_length=255, blank=True, default="", verbose_name="Iqtisod bo'lim boshlig'i"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tashkilot sozlamalari"
        verbose_name_plural = "Tashkilot sozlamalari"

    def __str__(self) -> str:
        return "Tashkilot sozlamalari"

    @classmethod
    def get_instance(cls) -> "OrganizationSettings":
        obj, _ = cls.objects.get_or_create(id=1)
        return obj
