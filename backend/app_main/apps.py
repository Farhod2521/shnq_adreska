from django.apps import AppConfig


class AppMainConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "app_main"

    def ready(self):
        from django.contrib.auth.signals import user_logged_in

        from .models import LoginAttempt
        from .security import record_attempt

        # /admin/ orqali muvaffaqiyatli kirishni jurnalga yozish (API o'zi yozadi, u login() chaqirmaydi)
        def log_admin_login(sender, request, user, **kwargs):
            record_attempt(user.get_username(), request, LoginAttempt.Result.SUCCESS)

        user_logged_in.connect(log_admin_login, dispatch_uid="app_main.log_admin_login", weak=False)
