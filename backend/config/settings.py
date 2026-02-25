import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def to_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def split_csv(value: str | None, default: list[str] | None = None) -> list[str]:
    if not value:
        return default or []
    return [item.strip() for item in value.split(",") if item.strip()]


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-change-this-secret-key")
DEBUG = to_bool(os.getenv("DJANGO_DEBUG"), default=False)
ALLOWED_HOSTS = split_csv(
    os.getenv("DJANGO_ALLOWED_HOSTS"),
    default=["127.0.0.1", "localhost", "adreska.tmsiti.uz", "adreska-api.tmsiti.uz"],
)


INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_yasg",
    "app_main",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


DB_ENGINE = os.getenv("DB_ENGINE", "postgres").strip().lower()

if DB_ENGINE == "postgres":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "shnq_db"),
            "USER": os.getenv("POSTGRES_USER", "shnq_user"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "change_me"),
            "HOST": os.getenv("POSTGRES_HOST", "postgres"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


LANGUAGE_CODE = "uz"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True


STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


CORS_ALLOW_ALL_ORIGINS = to_bool(os.getenv("CORS_ALLOW_ALL_ORIGINS"), default=False)
CORS_ALLOW_CREDENTIALS = to_bool(os.getenv("CORS_ALLOW_CREDENTIALS"), default=True)
CORS_ALLOWED_ORIGINS = split_csv(
    os.getenv("CORS_ALLOWED_ORIGINS"),
    default=["https://adreska.tmsiti.uz"],
)
CSRF_TRUSTED_ORIGINS = split_csv(
    os.getenv("CSRF_TRUSTED_ORIGINS"),
    default=["https://adreska.tmsiti.uz", "https://adreska-api.tmsiti.uz"],
)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True


REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
}


JAZZMIN_SETTINGS = {
    "site_title": "SHNQ Admin",
    "site_header": "SHNQ Boshqaruv",
    "site_brand": "SHNQ API",
    "welcome_sign": "SHNQ boshqaruv paneliga xush kelibsiz",
    "show_sidebar": True,
    "navigation_expanded": True,
}


SWAGGER_SETTINGS = {
    "USE_SESSION_AUTH": False,
    "SECURITY_DEFINITIONS": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT format: Bearer <token>",
        }
    },
}
