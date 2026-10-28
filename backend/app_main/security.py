"""Autentifikatsiya xavfsizligi: MFA (TOTP), urinishlarni cheklash, sessiyalar, parol siyosati."""

import base64
import hashlib
import hmac
import logging
import re
import secrets
import struct
import time
import urllib.request
from datetime import timedelta
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth.backends import ModelBackend
from django.core import signing
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from .models import AuthSession, LoginAttempt, UserMFA

logger = logging.getLogger("app_main.security")


# --------------------------------------------------------------------------- so'rov ma'lumotlari


def client_ip(request) -> str | None:
    if request is None:
        return None
    # nginx X-Real-IP ni o'rnatadi; foydalanuvchi uni soxtalashtira olmaydi
    ip = request.META.get("HTTP_X_REAL_IP") or request.META.get("REMOTE_ADDR")
    return ip or None


def user_agent(request) -> str:
    if request is None:
        return ""
    return (request.META.get("HTTP_USER_AGENT") or "")[:512]


# --------------------------------------------------------------------------- urinishlarni cheklash

FAILED_RESULTS = (LoginAttempt.Result.FAILED_PASSWORD, LoginAttempt.Result.FAILED_MFA)


def record_attempt(username: str, request, result: str) -> None:
    LoginAttempt.objects.create(
        username=(username or "")[:150],
        ip_address=client_ip(request),
        user_agent=user_agent(request),
        result=result,
    )
    if result != LoginAttempt.Result.SUCCESS:
        logger.warning("Kirish urinishi: user=%s ip=%s natija=%s", username, client_ip(request), result)


def _failures_since(filter_q: Q, window_start) -> int:
    last_success = (
        LoginAttempt.objects.filter(filter_q, result=LoginAttempt.Result.SUCCESS, created_at__gte=window_start)
        .order_by("-created_at")
        .values_list("created_at", flat=True)
        .first()
    )
    since = max(window_start, last_success) if last_success else window_start
    return LoginAttempt.objects.filter(filter_q, result__in=FAILED_RESULTS, created_at__gt=since).count()


def is_locked(username: str, request) -> bool:
    """Oxirgi AUTH_LOCKOUT_MINUTES ichida juda ko'p xato urinish bo'lsa True."""
    window_start = timezone.now() - timedelta(minutes=settings.AUTH_LOCKOUT_MINUTES)
    if username and _failures_since(Q(username__iexact=username), window_start) >= settings.AUTH_LOCKOUT_MAX_ATTEMPTS:
        return True
    ip = client_ip(request)
    if ip and _failures_since(Q(ip_address=ip), window_start) >= settings.AUTH_LOCKOUT_MAX_ATTEMPTS_PER_IP:
        return True
    return False


class LockoutModelBackend(ModelBackend):
    """ModelBackend + bloklash va jurnal. API va /admin/ uchun umumiy."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get("username")
        if username and is_locked(username, request):
            record_attempt(username, request, LoginAttempt.Result.LOCKED)
            raise PermissionDenied
        user = super().authenticate(request, username=username, password=password, **kwargs)
        if user is None and username:
            record_attempt(username, request, LoginAttempt.Result.FAILED_PASSWORD)
        return user


# --------------------------------------------------------------------------- TOTP (RFC 6238)

TOTP_STEP_SECONDS = 30
TOTP_DIGITS = 6


def generate_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii")


def _hotp(secret: str, counter: int) -> str:
    key = base64.b32decode(secret, casefold=True)
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = (struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF) % (10 ** TOTP_DIGITS)
    return str(code).zfill(TOTP_DIGITS)


def totp_now(secret: str) -> str:
    return _hotp(secret, int(time.time()) // TOTP_STEP_SECONDS)


def verify_totp(mfa: UserMFA, code: str) -> bool:
    """Kodni tekshiradi (±1 qadam), qayta ishlatilgan kodni rad etadi."""
    code = re.sub(r"\s", "", code or "")
    if not re.fullmatch(rf"\d{{{TOTP_DIGITS}}}", code):
        return False
    current = int(time.time()) // TOTP_STEP_SECONDS
    for step in (current - 1, current, current + 1):
        if mfa.last_used_step is not None and step <= mfa.last_used_step:
            continue
        if hmac.compare_digest(_hotp(mfa.secret, step), code):
            mfa.last_used_step = step
            mfa.save(update_fields=["last_used_step"])
            return True
    return False


def totp_uri(user, secret: str) -> str:
    issuer = settings.AUTH_MFA_ISSUER
    label = quote(f"{issuer}:{user.get_username()}")
    return f"otpauth://totp/{label}?secret={secret}&issuer={quote(issuer)}&digits={TOTP_DIGITS}&period={TOTP_STEP_SECONDS}"


def qr_svg(data: str) -> str:
    import qrcode
    import qrcode.image.svg

    img = qrcode.make(data, image_factory=qrcode.image.svg.SvgPathImage, box_size=8, border=2)
    return img.to_string(encoding="unicode")


# Parol tekshirilgandan keyin beriladigan qisqa muddatli "MFA chiptasi"
MFA_TICKET_SALT = "app_main.mfa-ticket"


def make_mfa_ticket(user) -> str:
    # Parol xeshi o'zgarsa, chipta yaroqsiz bo'ladi
    return signing.dumps({"uid": user.pk, "ph": user.password[-16:]}, salt=MFA_TICKET_SALT)


def read_mfa_ticket(ticket: str):
    from django.contrib.auth import get_user_model

    try:
        data = signing.loads(ticket or "", salt=MFA_TICKET_SALT, max_age=settings.AUTH_MFA_TICKET_SECONDS)
    except signing.BadSignature:
        return None
    user = get_user_model().objects.filter(pk=data.get("uid"), is_active=True).first()
    if user is None or user.password[-16:] != data.get("ph"):
        return None
    return user


# --------------------------------------------------------------------------- API sessiyalari


def hash_token(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def _session_expired(session: AuthSession, now) -> bool:
    idle = timedelta(minutes=settings.AUTH_SESSION_IDLE_MINUTES)
    absolute = timedelta(hours=settings.AUTH_SESSION_MAX_HOURS)
    return session.last_activity + idle < now or session.created_at + absolute < now


def create_session(user, request) -> str:
    """Har bir kirishda yangi tasodifiy sessiya identifikatori yaratadi."""
    now = timezone.now()
    for old in AuthSession.objects.filter(user=user):
        if _session_expired(old, now):
            old.delete()
    key = secrets.token_urlsafe(32)
    AuthSession.objects.create(
        user=user,
        key_hash=hash_token(key),
        ip_address=client_ip(request),
        user_agent=user_agent(request),
    )
    return key


class SessionTokenAuthentication(BaseAuthentication):
    """`Authorization: Token <key>`. Faoliyatsizlik va umumiy muddat tugasa sessiya bekor qilinadi."""

    keyword = "Token"
    # Har so'rovda bazaga yozmaslik uchun oxirgi faollik shu oraliqda yangilanadi
    touch_interval = timedelta(seconds=60)

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != self.keyword.lower().encode():
            return None
        if len(auth) != 2:
            raise AuthenticationFailed("Token noto'g'ri.")
        try:
            key = auth[1].decode()
        except UnicodeError:
            raise AuthenticationFailed("Token noto'g'ri.")

        session = AuthSession.objects.select_related("user").filter(key_hash=hash_token(key)).first()
        if session is None or not session.user.is_active:
            raise AuthenticationFailed("Sessiya topilmadi yoki bekor qilingan.")

        now = timezone.now()
        if _session_expired(session, now):
            session.delete()
            raise AuthenticationFailed("Sessiya muddati tugadi. Qaytadan kiring.")
        if now - session.last_activity > self.touch_interval:
            AuthSession.objects.filter(pk=session.pk).update(last_activity=now)
        return session.user, session

    def authenticate_header(self, request):
        return self.keyword


# --------------------------------------------------------------------------- parol siyosati

# Standart / zavod / loyihaga oid parollar (raqam va belgilar olib tashlangan holda solishtiriladi)
DEFAULT_PASSWORD_WORDS = {
    "admin", "administrator", "root", "password", "parol", "qwerty", "qwertyuiop", "asdfgh", "zxcvbn",
    "letmein", "welcome", "changeme", "change_me", "change_me_strong_password", "default", "test",
    "user", "guest", "shnq", "adreska", "tmsiti", "django", "secret", "superuser", "abc", "pass",
}


class DefaultPasswordValidator:
    """Standart va taxmin qilinadigan parollarni taqiqlaydi (admin123, Password1!, adreska1234 ...)."""

    def validate(self, password, user=None):
        normalized = re.sub(r"[^a-z_]", "", password.lower().replace("@", "a").replace("0", "o"))
        stripped = re.sub(r"[\d\W_]+$", "", password.lower())
        if normalized in DEFAULT_PASSWORD_WORDS or stripped in DEFAULT_PASSWORD_WORDS or len(set(password)) < 4:
            raise ValidationError("Standart yoki oson taxmin qilinadigan paroldan foydalanish taqiqlangan.", code="default_password")

    def get_help_text(self):
        return "Parol standart (admin, password, qwerty va h.k.) yoki tizim nomidan iborat bo'lmasligi kerak."


class PwnedPasswordValidator:
    """Ma'lumotlar sizib chiqishida oshkor bo'lgan parollarni rad etadi (HaveIBeenPwned, k-anonimlik).

    Serverga parolning o'zi emas, SHA-1 xeshining faqat birinchi 5 belgisi yuboriladi.
    Xizmat mavjud bo'lmasa tekshiruv o'tkazib yuboriladi (jurnalga yoziladi).
    """

    api_url = "https://api.pwnedpasswords.com/range/"

    def validate(self, password, user=None):
        if not settings.AUTH_PWNED_PASSWORD_CHECK:
            return
        sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
        prefix, suffix = sha1[:5], sha1[5:]
        try:
            req = urllib.request.Request(self.api_url + prefix, headers={"Add-Padding": "true", "User-Agent": "shnq-adreska"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                body = resp.read().decode("utf-8")
        except Exception as exc:  # tarmoq xatosi kirishni to'xtatmasligi kerak
            logger.warning("Oshkor parollar bazasini tekshirib bo'lmadi: %s", exc)
            return
        for line in body.splitlines():
            hash_suffix, _, count = line.partition(":")
            if hash_suffix == suffix and int(count or 0) > 0:
                raise ValidationError("Bu parol ma'lumotlar sizib chiqishida oshkor bo'lgan. Boshqa parol tanlang.", code="pwned_password")

    def get_help_text(self):
        return "Parol oshkor bo'lgan parollar bazasida bo'lmasligi kerak."
