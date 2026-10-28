from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuthSession, LoginAttempt, UserMFA
from .security import (
    create_session,
    generate_totp_secret,
    is_locked,
    make_mfa_ticket,
    qr_svg,
    read_mfa_ticket,
    record_attempt,
    totp_uri,
    verify_totp,
)

LOCKED_MESSAGE = "Juda ko'p muvaffaqiyatsiz urinish. {minutes} daqiqadan so'ng qayta urinib ko'ring."


def _user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.get_full_name() or user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


def _locked_response():
    return Response(
        {"detail": LOCKED_MESSAGE.format(minutes=settings.AUTH_LOCKOUT_MINUTES), "code": "locked"},
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )


def _session_response(user, request):
    record_attempt(user.get_username(), request, LoginAttempt.Result.SUCCESS)
    token = create_session(user, request)
    return Response({"token": token, "user": _user_payload(user)}, status=status.HTTP_200_OK)


class LoginAPIView(APIView):
    """1-bosqich: login va parol. MFA yoqilgan bo'lsa token emas, MFA chiptasi qaytadi."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        if not username or not password:
            return Response(
                {"detail": "Login va parolni kiriting."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if is_locked(username, request):
            record_attempt(username, request, LoginAttempt.Result.LOCKED)
            return _locked_response()

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Login yoki parol noto'g'ri."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Standart / oshkor bo'lgan parol bilan kirish taqiqlanadi
        try:
            validate_password(password, user)
        except ValidationError:
            record_attempt(username, request, LoginAttempt.Result.WEAK_PASSWORD)
            return Response(
                {
                    "detail": "Parolingiz xavfsizlik talablariga javob bermaydi (standart yoki oshkor bo'lgan parol). "
                    "Parolni almashtirish uchun administratorga murojaat qiling.",
                    "code": "weak_password",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not settings.AUTH_MFA_REQUIRED:
            return _session_response(user, request)

        mfa, _ = UserMFA.objects.get_or_create(user=user, defaults={"secret": generate_totp_secret()})
        payload = {"mfa_required": True, "mfa_ticket": make_mfa_ticket(user)}
        if not mfa.is_confirmed:
            uri = totp_uri(user, mfa.secret)
            payload.update({"mfa_setup": True, "secret": mfa.secret, "otpauth_uri": uri, "qr_svg": qr_svg(uri)})
        return Response(payload, status=status.HTTP_200_OK)


class MfaVerifyAPIView(APIView):
    """2-bosqich: autentifikator ilovasidagi 6 xonali kod. Muvaffaqiyatli bo'lsa yangi sessiya tokeni."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        user = read_mfa_ticket(request.data.get("mfa_ticket"))
        if user is None:
            return Response(
                {"detail": "Tasdiqlash muddati tugadi. Qaytadan kiring.", "code": "ticket_expired"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        username = user.get_username()
        if is_locked(username, request):
            record_attempt(username, request, LoginAttempt.Result.LOCKED)
            return _locked_response()

        mfa = UserMFA.objects.filter(user=user).first()
        if mfa is None or not verify_totp(mfa, request.data.get("code") or ""):
            record_attempt(username, request, LoginAttempt.Result.FAILED_MFA)
            return Response({"detail": "Tasdiqlash kodi noto'g'ri."}, status=status.HTTP_400_BAD_REQUEST)

        if not mfa.is_confirmed:
            mfa.is_confirmed = True
            mfa.confirmed_at = timezone.now()
            mfa.save(update_fields=["is_confirmed", "confirmed_at"])
        return _session_response(user, request)


class LogoutAPIView(APIView):
    """Joriy sessiyani bekor qiladi. `all=true` bo'lsa foydalanuvchining barcha sessiyalari."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if str(request.data.get("all", "")).lower() in {"1", "true"}:
            AuthSession.objects.filter(user=request.user).delete()
        elif isinstance(request.auth, AuthSession):
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeAPIView(APIView):
    """Joriy foydalanuvchi ma'lumotlari."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_user_payload(request.user), status=status.HTTP_200_OK)
