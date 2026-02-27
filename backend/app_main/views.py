from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from openpyxl import load_workbook
from rest_framework import status
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    DocumentCalculation,
    DocumentCalculationCategory,
    NormativeCoefficient,
    StaffComposition,
)
from .serializers import (
    DocumentCalculationCreateSerializer,
    DocumentCalculationCategorySerializer,
    DocumentCalculationSerializer,
    HealthCheckSerializer,
    NormativeCoefficientSerializer,
    StaffCompositionSerializer,
)


class HealthCheckAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        payload = {
            "message": "app_main API ishlayapti",
            "service": "shnq-backend",
            "status": "ok",
        }
        serializer = HealthCheckSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NormativeCoefficientListAPIView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = NormativeCoefficientSerializer
    queryset = NormativeCoefficient.objects.filter(is_active=True).order_by("normative_type")


class StaffCompositionListAPIView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = StaffCompositionSerializer
    queryset = StaffComposition.objects.filter(is_active=True).order_by("sort_order", "id")


class DocumentCalculationCategoryListAPIView(ListAPIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = DocumentCalculationCategorySerializer
    queryset = DocumentCalculationCategory.objects.all().order_by("name", "id")


class DocumentCalculationListCreateAPIView(ListCreateAPIView):
    authentication_classes = []
    permission_classes = []
    queryset = DocumentCalculation.objects.all().order_by("-id")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DocumentCalculationCreateSerializer
        return DocumentCalculationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        response_data = DocumentCalculationSerializer(instance).data
        return Response(response_data, status=status.HTTP_201_CREATED)


class DocumentCalculationRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    authentication_classes = []
    permission_classes = []
    queryset = DocumentCalculation.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return DocumentCalculationCreateSerializer
        return DocumentCalculationSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        response_data = DocumentCalculationSerializer(instance).data
        return Response(response_data, status=status.HTTP_200_OK)


def _normalize_header(value) -> str:
    if value is None:
        return ""
    return str(value).strip().lower().replace(" ", "_")


def _to_text(value, default: str = "") -> str:
    if value is None:
        return default
    return str(value).strip()


def _to_int(value, default: int = 0) -> int:
    if value in (None, ""):
        return default
    try:
        return int(float(str(value).replace(",", ".").strip()))
    except (TypeError, ValueError):
        return default


def _to_decimal(value, default: Decimal = Decimal("0.00")) -> Decimal:
    if value in (None, ""):
        return default
    if isinstance(value, Decimal):
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    normalized = str(value).replace("\u00a0", "").replace(" ", "").replace(",", ".").strip()
    try:
        return Decimal(normalized).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        return default


class DocumentCalculationXlsxImportAPIView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "XLSX fayl yuborilmadi."}, status=status.HTTP_400_BAD_REQUEST)
        if not file_obj.name.lower().endswith(".xlsx"):
            return Response({"detail": "Faqat .xlsx formatdagi fayl qo'llab-quvvatlanadi."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            workbook = load_workbook(file_obj, data_only=True)
            worksheet = workbook.active
        except Exception:
            return Response({"detail": "XLSX faylni o'qib bo'lmadi."}, status=status.HTTP_400_BAD_REQUEST)

        rows_iter = worksheet.iter_rows(values_only=True)
        header_row = next(rows_iter, None)
        if not header_row:
            return Response({"detail": "XLSX fayl bo'sh."}, status=status.HTTP_400_BAD_REQUEST)

        headers = [_normalize_header(cell) for cell in header_row]
        header_index = {header: idx for idx, header in enumerate(headers) if header}
        required_headers = [
            "category",
            "name",
            "development_deadline",
            "executor_organization",
            "notes",
            "total_pages",
            "normative_type",
            "document_category",
            "complexity_level",
            "completed_amount",
        ]
        missing_headers = [header for header in required_headers if header not in header_index]
        if missing_headers:
            return Response(
                {"detail": "XLSX ustunlari to'liq emas.", "missing_headers": missing_headers},
                status=status.HTTP_400_BAD_REQUEST,
            )

        final_total_header = next(
            (
                key
                for key in ("final_total_amount", "final_total", "total_amount", "umumiy_narxi")
                if key in header_index
            ),
            None,
        )
        normative_values = {choice[0] for choice in NormativeCoefficient.NormativeType.choices}
        document_category_values = {choice[0] for choice in DocumentCalculation.DocumentCategory.choices}
        complexity_values = {choice[0] for choice in DocumentCalculation.ComplexityLevel.choices}

        # XLSX importida staff tarkibi berilmaydi, shuning uchun default sifatida 1 tadan olinadi.
        default_staff_counts = {
            str(staff.id): 1 for staff in StaffComposition.objects.filter(is_active=True).order_by("sort_order", "id")
        }

        created_count = 0
        errors = []

        with transaction.atomic():
            for row_number, row in enumerate(rows_iter, start=2):
                if row is None:
                    continue
                if all(value in (None, "") for value in row):
                    continue

                get_value = lambda key: row[header_index[key]] if header_index[key] < len(row) else None

                name = _to_text(get_value("name"))
                if not name:
                    continue

                category_name = _to_text(get_value("category"))
                development_deadline = _to_text(get_value("development_deadline"))
                executor_organization = _to_text(get_value("executor_organization"))
                notes = _to_text(get_value("notes"))
                total_pages = max(_to_int(get_value("total_pages"), default=0), 0)
                complexity_level = _to_text(get_value("complexity_level"))
                if complexity_level.endswith(".0"):
                    complexity_level = complexity_level[:-2]

                raw_normative = _to_text(get_value("normative_type"))
                raw_document_category = _to_text(get_value("document_category"))

                # Fayldagi ustunlar joylashuvi almashib qolsa avtomatik tuzatamiz.
                if raw_normative in document_category_values and raw_document_category in normative_values:
                    raw_normative, raw_document_category = raw_document_category, raw_normative

                if raw_normative not in normative_values:
                    errors.append(
                        {
                            "row": row_number,
                            "field": "normative_type",
                            "message": f"Noto'g'ri qiymat: {raw_normative}",
                        }
                    )
                    continue
                if raw_document_category not in document_category_values:
                    errors.append(
                        {
                            "row": row_number,
                            "field": "document_category",
                            "message": f"Noto'g'ri qiymat: {raw_document_category}",
                        }
                    )
                    continue
                if complexity_level not in complexity_values:
                    errors.append(
                        {
                            "row": row_number,
                            "field": "complexity_level",
                            "message": f"Noto'g'ri qiymat: {complexity_level}",
                        }
                    )
                    continue

                completed_amount = _to_decimal(get_value("completed_amount"))
                final_total_from_xlsx = (
                    _to_decimal(row[header_index[final_total_header]], default=Decimal("0.00"))
                    if final_total_header and header_index[final_total_header] < len(row)
                    else None
                )
                category_obj = None
                if category_name:
                    category_obj, _ = DocumentCalculationCategory.objects.get_or_create(name=category_name)

                instance = DocumentCalculation(
                    calculation_category=category_obj,
                    name=name,
                    total_pages=total_pages,
                    normative_type=raw_normative,
                    document_category=raw_document_category,
                    complexity_level=complexity_level,
                    is_research_required=False,
                    development_deadline=development_deadline,
                    executor_organization=executor_organization,
                    notes=notes,
                    completed_amount=completed_amount,
                )
                instance.apply_normative_coefficients()
                instance.build_staff_snapshot(default_staff_counts)

                if final_total_from_xlsx is not None:
                    instance.final_total_amount = final_total_from_xlsx
                else:
                    instance.recalculate_final_total_amount()

                # Shart: planned = final_total - completed, completed=0 bo'lsa planned=final_total bo'ladi.
                instance.planned_amount = (instance.final_total_amount - completed_amount).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                instance.save()
                created_count += 1

            if errors:
                transaction.set_rollback(True)
                return Response(
                    {
                        "detail": "XLSX importda xatoliklar bor.",
                        "created_count": 0,
                        "error_count": len(errors),
                        "errors": errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(
            {
                "detail": "XLSX ma'lumotlari muvaffaqiyatli import qilindi.",
                "created_count": created_count,
                "error_count": 0,
                "errors": [],
            },
            status=status.HTTP_201_CREATED,
        )


class DashboardStatsAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        queryset = DocumentCalculation.objects.all()
        now = timezone.localtime()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        type_choices = dict(NormativeCoefficient.NormativeType.choices)
        type_keys = list(type_choices.keys())

        by_type_rows = (
            queryset.values("normative_type")
            .annotate(
                count=Count("id"),
                total_amount=Coalesce(Sum("final_total_amount"), Value(Decimal("0.00"))),
            )
            .order_by("normative_type")
        )
        by_type_map = {row["normative_type"]: row for row in by_type_rows}

        this_month_rows = (
            queryset.filter(created_at__gte=month_start)
            .values("normative_type")
            .annotate(count=Count("id"))
            .order_by("normative_type")
        )
        this_month_map = {row["normative_type"]: row["count"] for row in this_month_rows}

        type_stats = []
        for key in type_keys:
            data = by_type_map.get(key, {})
            type_stats.append(
                {
                    "normative_type": key,
                    "label": type_choices[key],
                    "count": data.get("count", 0),
                    "this_month_count": this_month_map.get(key, 0),
                    "total_amount": data.get("total_amount", Decimal("0.00")),
                }
            )

        # Oxirgi 6 oy dinamikasi (jami hujjatlar soni)
        def shift_month(base: datetime, months_back: int) -> datetime:
            year = base.year
            month = base.month - months_back
            while month <= 0:
                month += 12
                year -= 1
            return base.replace(year=year, month=month, day=1)

        start_month = shift_month(month_start, 5)
        monthly_rows = (
            queryset.filter(created_at__gte=start_month)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        monthly_count_map = {
            row["month"].strftime("%Y-%m"): row["count"] for row in monthly_rows if row["month"] is not None
        }

        trend = []
        month_labels = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]
        for offset in range(5, -1, -1):
            m = shift_month(month_start, offset)
            key = m.strftime("%Y-%m")
            trend.append(
                {
                    "key": key,
                    "label": month_labels[m.month - 1],
                    "count": monthly_count_map.get(key, 0),
                }
            )

        latest_rows = list(
            queryset.order_by("-created_at").values(
                "id",
                "name",
                "normative_type",
                "document_category",
                "final_total_amount",
                "created_at",
            )[:5]
        )

        totals = queryset.aggregate(
            total_documents=Count("id"),
            total_amount=Coalesce(Sum("final_total_amount"), Value(Decimal("0.00"))),
        )

        payload = {
            "totals": totals,
            "types": type_stats,
            "trend_last_6_months": trend,
            "latest_calculations": latest_rows,
        }
        return Response(payload, status=status.HTTP_200_OK)
