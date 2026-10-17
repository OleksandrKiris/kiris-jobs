"""Shared *local-only* settings. Import using dev or test; never deploy."""
from pathlib import Path
import secrets

BASE_DIR = Path(__file__).resolve().parents[2]
SECRET_KEY = secrets.token_urlsafe(48)  # Ephemeral, not saved; never use in production.
DEBUG = False
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "testserver"]
INSTALLED_APPS = ["core"]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "core.middleware.APIGuardMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = []
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
        "TEST": {"NAME": ":memory:"},
    }
}
USE_TZ = True
TIME_ZONE = "UTC"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "no-referrer"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"
DATA_UPLOAD_MAX_MEMORY_SIZE = 16_384
FILE_UPLOAD_MAX_MEMORY_SIZE = 16_384
CORE_MAX_CONTENT_LENGTH = 16_384
CORE_RATE_LIMIT_PER_MINUTE = 120
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "primserv-local-only"}}
# Django's default request/server loggers can include URLs and query strings.
# Log only fixed fields through core.middleware, never request path/body/IP/headers.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {"plain": {"format": "%(levelname)s %(name)s %(message)s"}},
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "plain"},
        "null": {"class": "logging.NullHandler"},
    },
    "loggers": {
        "core.requests": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.request": {"handlers": ["null"], "level": "WARNING", "propagate": False},
        "django.server": {"handlers": ["null"], "level": "INFO", "propagate": False},
        "django.security": {"handlers": ["null"], "level": "WARNING", "propagate": False},
    },
}
