# Production Deploy (Docker + PostgreSQL + Nginx + SSL)

Bu loyiha uchun production infratuzilma tayyorlandi:

- `postgres` (ma'lumotlar bazasi)
- `backend` (Django, `gunicorn`, `1000` port)
- `frontend` (Next.js, `1001` port)
- `nginx` (reverse proxy, 80/443)
- `certbot` (Let's Encrypt SSL)

Domainlar:

- Frontend: `adreska.tmsiti.uz`
- Backend API: `adreska-api.tmsiti.uz`

Server IP: `185.74.5.15`

## 1) DNS

Quyidagilar A-record bilan serverga yo'naltirilgan bo'lishi kerak:

- `adreska.tmsiti.uz` -> `185.74.5.15`
- `adreska-api.tmsiti.uz` -> `185.74.5.15`

## 2) One-command deploy

Serverda loyiha papkasiga kirib:

```bash
chmod +x deploy/scripts/deploy.sh deploy/scripts/renew-certs.sh
./deploy/scripts/deploy.sh
```

Skript avtomatik:

1. Docker va Docker Compose'ni o'rnatadi (yo'q bo'lsa)
2. `.env.production` yaratadi (`.env.production.example`dan)
3. Tasodifiy `POSTGRES_PASSWORD` va `DJANGO_SECRET_KEY` yaratadi (agar placeholder bo'lsa)
4. DNS IP'ni tekshiradi
5. Dummy SSL yaratadi
6. Containerlarni build/run qiladi
7. Let's Encrypt haqiqiy SSL sertifikatini oladi
8. Nginx reload qiladi
9. SSL renew uchun cron qo'shadi

## 3) Muhim sozlama

Deploydan oldin `.env.production` ichida `LETSENCRYPT_EMAIL`ni haqiqiy emailga almashtiring.

## 4) Tekshirish

```bash
docker compose --env-file .env.production ps
curl -I https://adreska.tmsiti.uz
curl -I https://adreska-api.tmsiti.uz/api/health/
```

## 5) Qo'lda SSL renew (agar kerak bo'lsa)

```bash
./deploy/scripts/renew-certs.sh
```
