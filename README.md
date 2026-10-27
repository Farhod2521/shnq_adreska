# shnq_adreska
## Avtorizatsiya (login / parol)

- Backend token avtorizatsiyasidan foydalanadi (`POST /api/auth/login/`, `POST /api/auth/logout/`, `GET /api/auth/me/`).
  `/api/health/` dan boshqa barcha API'lar `Authorization: Token <token>` talab qiladi.
- Admin foydalanuvchi backend konteyneri ishga tushganda `DJANGO_ADMIN_USERNAME` / `DJANGO_ADMIN_PASSWORD`
  o'zgaruvchilaridan yaratiladi (mavjud bo'lsa paroli yangilanadi):
  - lokal (`docker-compose.local.yml`): `admin` / `Adreska@2026`
  - production: `.env.production` faylida o'zingiz belgilaysiz.
- Qo'shimcha foydalanuvchilar: `docker exec -it shnq_backend python manage.py createsuperuser`
  yoki `/admin/` panelidan.
- Frontend: tokensiz himoyalangan sahifaga kirilsa `/401`, API 403 qaytarsa `/403`,
  mavjud bo'lmagan sahifa uchun `/404` ko'rsatiladi.
