"""Local API response headers; no request or user data is retained."""
import uuid

from .protocol import API_VERSION


class APIGuardMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith("/api/"):
            response["X-API-Version"] = API_VERSION
            response["X-Request-ID"] = uuid.uuid4().hex
            response["Cache-Control"] = "no-store"
        return response
