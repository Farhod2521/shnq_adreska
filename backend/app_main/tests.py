from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import AuthSession, LoginAttempt, UserMFA
from .security import totp_now

PASSWORD = "Qurilish-Reglament!7429"


@override_settings(AUTH_PWNED_PASSWORD_CHECK=False, AUTH_MFA_REQUIRED=True)
class AuthSecurityTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("operator", password=PASSWORD, is_staff=True)
        self.client = APIClient()

    def login(self, password=PASSWORD):
        return self.client.post("/api/auth/login/", {"username": "operator", "password": password}, format="json")

    def full_login(self):
        ticket = self.login().data["mfa_ticket"]
        mfa = UserMFA.objects.get(user=self.user)
        mfa.last_used_step = None
        mfa.save()
        resp = self.client.post("/api/auth/mfa/verify/", {"mfa_ticket": ticket, "code": totp_now(mfa.secret)}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        return resp.data["token"]

    def test_password_alone_gives_no_token(self):
        resp = self.login()
        self.assertEqual(resp.status_code, 200)
        self.assertNotIn("token", resp.data)
        self.assertTrue(resp.data["mfa_setup"])
        self.assertIn("<svg", resp.data["qr_svg"])

    def test_mfa_wrong_code_rejected_and_logged(self):
        ticket = self.login().data["mfa_ticket"]
        resp = self.client.post("/api/auth/mfa/verify/", {"mfa_ticket": ticket, "code": "000000"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertTrue(LoginAttempt.objects.filter(result=LoginAttempt.Result.FAILED_MFA).exists())

    def test_mfa_code_cannot_be_reused(self):
        self.full_login()
        mfa = UserMFA.objects.get(user=self.user)
        self.assertTrue(mfa.is_confirmed)
        ticket = self.login().data["mfa_ticket"]
        self.assertNotIn("mfa_setup", self.login().data)
        resp = self.client.post("/api/auth/mfa/verify/", {"mfa_ticket": ticket, "code": totp_now(mfa.secret)}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_lockout_after_failed_attempts(self):
        for left in (4, 3, 2, 1):
            resp = self.login("noto'g'ri-parol")
            self.assertEqual(resp.status_code, 401)
            self.assertEqual(resp.data["attempts_left"], left)
        # 5-xato urinishning o'zidayoq blok xabari qaytadi
        self.assertEqual(self.login("noto'g'ri-parol").status_code, 429)
        self.assertEqual(self.login().status_code, 429)
        self.assertEqual(LoginAttempt.objects.filter(result=LoginAttempt.Result.FAILED_PASSWORD).count(), 5)
        self.assertTrue(LoginAttempt.objects.filter(result=LoginAttempt.Result.LOCKED).exists())

    def test_lockout_expires(self):
        for _ in range(5):
            self.login("noto'g'ri-parol")
        LoginAttempt.objects.update(created_at=timezone.now() - timedelta(minutes=11))
        self.assertEqual(self.login().status_code, 200)

    def test_new_session_id_on_every_login(self):
        first = self.full_login()
        second = self.full_login()
        self.assertNotEqual(first, second)
        self.assertFalse(AuthSession.objects.filter(key_hash=first).exists())  # faqat xesh saqlanadi

    def test_logout_invalidates_session(self):
        token = self.full_login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_idle_session_expires(self):
        token = self.full_login()
        AuthSession.objects.update(last_activity=timezone.now() - timedelta(minutes=31))
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)
        self.assertFalse(AuthSession.objects.exists())

    def test_absolute_session_lifetime(self):
        token = self.full_login()
        AuthSession.objects.update(created_at=timezone.now() - timedelta(hours=13))
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_default_passwords_rejected(self):
        for weak in ["admin123", "Admin@123", "P@ssw0rd", "adreska1234", "change_me_strong_password", "qwerty123456", "aaaaaaaaaaaa"]:
            with self.assertRaises(ValidationError, msg=weak):
                validate_password(weak)
        validate_password(PASSWORD)

    def test_login_with_weak_password_blocked(self):
        self.user.set_password("admin12345")
        self.user.save()
        resp = self.login("admin12345")
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.data["code"], "weak_password")


@override_settings(AUTH_PWNED_PASSWORD_CHECK=False, AUTH_MFA_REQUIRED=True)
class AdminLoginMfaTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser("boss", password=PASSWORD)

    def post(self, code=""):
        return self.client.post("/admin/login/?next=/admin/", {"username": "boss", "password": PASSWORD, "otp_code": code})

    def test_admin_requires_configured_mfa(self):
        resp = self.post()
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "sozlanmagan")

    def test_admin_login_with_code(self):
        mfa = UserMFA.objects.create(user=self.user, secret="JBSWY3DPEHPK3PXP", is_confirmed=True)
        self.assertEqual(self.post("123456").status_code, 200)
        resp = self.post(totp_now(mfa.secret))
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(LoginAttempt.objects.filter(username="boss", result=LoginAttempt.Result.SUCCESS).exists())
