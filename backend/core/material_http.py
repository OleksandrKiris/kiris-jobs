"""Local GET transport for the accepted public materials snapshot reference."""
import json
from pathlib import Path

from django.core.exceptions import SuspiciousOperation
from django.http import HttpResponse

from .material_response import MaterialResponseTooLarge, serialize_material_response


PROVIDER_PATH = (Path(__file__).resolve().parents[2] / 'contracts' /
                 'materials-v1' / 'local_mock.py')
ERROR_STATUS = {
    'INVALID_QUERY': 400,
    'INVALID_LOCATION': 400,
    'INVALID_LANGUAGE': 400,
    'INVALID_LIMIT': 400,
    'INVALID_CURSOR': 400,
    'METHOD_NOT_ALLOWED': 405,
    'RESPONSE_TOO_LARGE': 500,
    'INTERNAL_ERROR': 500,
}


def _canonical_provider():
    # Execute only this accepted repository module. Avoid sys.path/module-cache
    # changes and bytecode-cache writes; no request value can select code/files.
    namespace = {'__file__': str(PROVIDER_PATH),
                 '__name__': '_primserv_materials_v1_reference'}
    source = PROVIDER_PATH.read_bytes()
    exec(compile(source, str(PROVIDER_PATH), 'exec'), namespace)
    return namespace


def _read_canonical_snapshot(query_pairs):
    namespace = _canonical_provider()
    return namespace['mock_api'](query_pairs, method='GET')


def _http(body, *, status=200):
    response = HttpResponse(body, status=status,
                            content_type='application/json; charset=utf-8')
    response['Content-Length'] = str(len(body))
    response['Cache-Control'] = 'no-store'
    response['X-Content-Type-Options'] = 'nosniff'
    return response


def _error(request, code, *, status):
    # Provider/client IDs and error fields never enter this new fixed envelope.
    body = json.dumps({'code': code, 'request_id': request.core_request_id},
                      separators=(',', ':')).encode('utf-8')
    response = _http(body, status=status)
    if status == 405:
        response['Allow'] = 'GET'
    return response


def list_materials(request):
    """Serve the local canonical reference; no domain, DB or online provider."""
    if request.method != 'GET':
        return _error(request, 'METHOD_NOT_ALLOWED', status=405)
    try:
        # Flatten lists rather than collapsing QueryDict to a single value.
        pairs = [(key, value) for key, values in request.GET.lists()
                 for value in values]
    except (SuspiciousOperation, UnicodeError, ValueError):
        return _error(request, 'INVALID_QUERY', status=400)
    try:
        status, document = _read_canonical_snapshot(pairs)
        if type(status) is not int:
            return _error(request, 'INTERNAL_ERROR', status=500)
        if status == 200:
            body = serialize_material_response(document)
        elif (type(document) is dict and isinstance(document.get('code'), str)
              and ERROR_STATUS.get(document['code']) == status):
            return _error(request, document['code'], status=status)
        else:
            return _error(request, 'INTERNAL_ERROR', status=500)
    except MaterialResponseTooLarge:
        return _error(request, 'RESPONSE_TOO_LARGE', status=500)
    except Exception:
        # This narrow provider/serializer boundary also covers configuration
        # I/O and schema failures. Never delegate their details to DEBUG pages.
        return _error(request, 'INTERNAL_ERROR', status=500)
    return _http(body)
