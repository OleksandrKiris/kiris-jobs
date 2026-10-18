"""Only owner 12 edits common URLs; domain routes join after contract 13."""
from django.urls import path, re_path

from core.capabilities import capabilities
from core.material_http import list_materials
from core.views import health, not_found, version

urlpatterns = [
    path("api/v1/health/", health, name="core-health"),
    path("api/v1/version/", version, name="core-version"),
    path("api/v1/materials/", list_materials, name="core-materials"),
    path("api/v1/capabilities/", capabilities, name="core-capabilities"),
    re_path(r"^api/.*$", not_found, name="core-api-not-found"),
]

handler500 = "core.views.server_error"
handler400 = "core.views.bad_request"
