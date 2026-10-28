from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from app_main.models import AuthSession, UserMFA


class Command(BaseCommand):
    help = "Foydalanuvchining 2FA sozlamasini o'chiradi (telefon yo'qolganda). Keyingi kirishda qayta sozlanadi."

    def add_arguments(self, parser):
        parser.add_argument("username")

    def handle(self, *args, **options):
        user = get_user_model().objects.filter(username=options["username"]).first()
        if user is None:
            raise CommandError(f"'{options['username']}' foydalanuvchi topilmadi.")
        UserMFA.objects.filter(user=user).delete()
        AuthSession.objects.filter(user=user).delete()
        self.stdout.write(self.style.SUCCESS(f"'{user.username}' uchun 2FA va barcha sessiyalar bekor qilindi."))
