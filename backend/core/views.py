"""Read-only, intentionally unconnected health and version endpoints."""
from django.http import JsonResponse

from .protocol import API_VERSION, SERVICE_NAME, SERVICE_VERSION, error_document


def api_error(code: str, message: str, *, status: int) -> JsonResponse:
    return JsonResponse(error_document(code, message), status=status)


def read_only(request, document: dict) -> JsonResponse:
    if request.method not in ("GET", "HEAD"):
        response = api_error("method_not_allowed", "Only GET and HEAD are allowed.", status=405)
        response["Allow"] = "GET, HEAD"
        return response
    return JsonResponse(document)


def health(request):
    return read_only(request, {"api_version": API_VERSION, "service": SERVICE_NAME, "status": "ok"})


def version(request):
    return read_only(request, {"api_version": API_VERSION, "service": SERVICE_NAME, "version": SERVICE_VERSION})


def not_found(request):
    return api_error("not_found", "API endpoint does not exist.", status=404)


def server_error(request):
    return api_error("internal_error", "The request could not be completed.", status=500)
