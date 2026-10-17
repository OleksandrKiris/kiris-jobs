"""Small dependency-free public API contract, testable without Django."""
API_VERSION = "1"
SERVICE_VERSION = "0.1.0"
SERVICE_NAME = "primserv-core"


def error_document(code: str, message: str) -> dict:
    return {"api_version": API_VERSION, "error": {"code": code, "message": message}}
