from datetime import datetime
from decimal import Decimal

from django.db.models import Count, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListAPIView, ListCreateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DocumentCalculation, NormativeCoefficient, StaffComposition
from .serializers import (
    DocumentCalculationCreateSerializer,
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
