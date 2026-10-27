import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "DJANGO_ADMIN_USERNAME / DJANGO_ADMIN_PASSWORD asosida admin foydalanuvchini yaratadi yoki parolini yangilaydi."

    def handle(self, *args, **options):
        username = os.getenv("DJANGO_ADMIN_USERNAME", "").strip()
        password = os.getenv("DJANGO_ADMIN_PASSWORD", "")
        email = os.getenv("DJANGO_ADMIN_EMAIL", "").strip()

        if not username or not password:
            self.stdout.write("DJANGO_ADMIN_USERNAME/DJANGO_ADMIN_PASSWORD berilmagan, admin yaratilmadi.")
            return

        User = get_user_model()
        user, created = User.objects.get_or_create(username=username, defaults={"email": email})
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        if email:
            user.email = email
        user.set_password(password)
        user.save()

        action = "yaratildi" if created else "yangilandi"
        self.stdout.write(self.style.SUCCESS(f"Admin foydalanuvchi '{username}' {action}."))
