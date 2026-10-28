from django import forms
from django.conf import settings
from django.contrib import admin
from django.contrib.admin.forms import AdminAuthenticationForm

from .models import (
    AuthSession,
    DocumentCalculation,
    DocumentCalculationCategory,
    LoginAttempt,
    NormativeCoefficient,
    UserMFA,
)
from .security import record_attempt, verify_totp


class OTPAdminAuthenticationForm(AdminAuthenticationForm):
    """Admin panelga kirish: login/parol + autentifikator ilovasidagi kod."""

    otp_code = forms.CharField(label="Tasdiqlash kodi (2FA)", max_length=6, required=False)

    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if not settings.AUTH_MFA_REQUIRED:
            return
        mfa = UserMFA.objects.filter(user=user, is_confirmed=True).first()
        if mfa is None:
            raise forms.ValidationError(
                "Ikki bosqichli autentifikatsiya sozlanmagan. Avval veb-ilova orqali kirib, 2FA ni sozlang.",
                code="mfa_not_configured",
            )
        if not verify_totp(mfa, self.cleaned_data.get("otp_code") or ""):
            record_attempt(user.get_username(), self.request, LoginAttempt.Result.FAILED_MFA)
            raise forms.ValidationError("Tasdiqlash kodi noto'g'ri.", code="invalid_otp")

    def get_invalid_login_error(self):
        return forms.ValidationError(
            "Login yoki parol noto'g'ri, yoki ko'p urinishlar sababli kirish vaqtincha bloklangan.",
            code="invalid_login",
        )


admin.site.login_form = OTPAdminAuthenticationForm


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ("created_at", "username", "ip_address", "result", "user_agent")
    list_filter = ("result", "created_at")
    search_fields = ("username", "ip_address")
    readonly_fields = [f.name for f in LoginAttempt._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(UserMFA)
class UserMFAAdmin(admin.ModelAdmin):
    list_display = ("user", "is_confirmed", "confirmed_at")
    list_filter = ("is_confirmed",)
    search_fields = ("user__username",)
    fields = ("user", "is_confirmed", "confirmed_at")
    readonly_fields = ("user", "is_confirmed", "confirmed_at")

    def has_add_permission(self, request):
        return False


@admin.register(AuthSession)
class AuthSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "ip_address", "created_at", "last_activity", "user_agent")
    search_fields = ("user__username", "ip_address")
    fields = ("user", "ip_address", "user_agent", "created_at", "last_activity")
    readonly_fields = fields

    def has_add_permission(self, request):
        return False


@admin.register(NormativeCoefficient)
class NormativeCoefficientAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "normative_type",
        "new_document_base",
        "rework_harmonization_base",
        "rework_modification_base",
        "additional_change_base",
        "complexity_level_1",
        "complexity_level_2",
        "complexity_level_3",
        "is_active",
    )
    list_filter = ("normative_type", "is_active")


@admin.register(DocumentCalculation)
class DocumentCalculationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "designation",
        "name",
        "normative_type",
        "document_category",
        "calculation_category",
        "complexity_level",
        "selected_base_coefficient",
        "total_pages",
        "is_research_required",
        "completed_amount",
        "planned_amount",
        "development_deadline",
        "executor_organization",
        "final_total_amount",
        "created_at",
    )
    list_filter = (
        "normative_type",
        "document_category",
        "calculation_category",
        "complexity_level",
        "is_research_required",
    )
    search_fields = ("name", "designation")


@admin.register(DocumentCalculationCategory)
class DocumentCalculationCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at", "updated_at")
    search_fields = ("name",)
