"""Only owner 12 edits common URLs; domain routes join after contract 13."""
from django.urls import path, re_path

from core.views import health, not_found, version

urlpatterns = [
    path("api/v1/health/", health, name="core-health"),
    path("api/v1/version/", version, name="core-version"),
    re_path(r"^api/.*$", not_found, name="core-api-not-found"),
]

handler500 = "core.views.server_error"
