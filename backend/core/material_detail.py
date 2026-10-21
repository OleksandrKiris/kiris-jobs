"""Local material lookup after a complete, bounded canonical source check."""
import json
import re

from django.core.exceptions import SuspiciousOperation

from .material_http import _canonical_provider, _error, _http
from .material_response import MaterialResponseTooLarge, serialize_material_response
from .material_schema import material_detail_validator


SOURCE_ERROR_STATUS = {
    'INVALID_QUERY': 400,
    'INVALID_LOCATION': 400,
    'INVALID_LANGUAGE': 400,
    'RESPONSE_TOO_LARGE': 500,
    'INTERNAL_ERROR': 500,
}


def _read_canonical_detail_snapshot(query_pairs):
    provider = _canonical_provider()
    query = dict(query_pairs)
    # Use the accepted filter/language rules without reading the source first.
    status, document = provider['read_snapshot'](query, {'items': []})
    if status != 200:
        return status, document
    source = json.loads(provider['SNAPSHOT'].read_text(encoding='utf-8'))
    # The reference list adapter slices before returning. Check the raw complete
    # source first, so even out-of-range items and encoding faults cannot hide.
    serialize_material_response(source)
    return provider['read_snapshot'](query, source)


def material_detail(request, material_id):
    """Serve the exact accepted detail envelope; no DB or online adapter."""
    if request.method != 'GET':
        return _error(request, 'METHOD_NOT_ALLOWED', status=405)
    if re.fullmatch(r'[a-z0-9-]{1,80}', material_id) is None:
        return _error(request, 'INVALID_MATERIAL_ID', status=400)
    try:
        pairs = [(key, value) for key, values in request.GET.lists()
                 for value in values]
        if (len({key for key, _ in pairs}) != len(pairs)
                or any(key not in {'location_id', 'language'} for key, _ in pairs)):
            return _error(request, 'INVALID_QUERY', status=400)
    except (SuspiciousOperation, UnicodeError, ValueError):
        return _error(request, 'INVALID_QUERY', status=400)
    try:
        status, document = _read_canonical_detail_snapshot(pairs)
        if type(status) is not int:
            return _error(request, 'INTERNAL_ERROR', status=500)
        if status != 200:
            if (type(document) is dict and isinstance(document.get('code'), str)
                    and SOURCE_ERROR_STATUS.get(document['code']) == status):
                return _error(request, document['code'], status=status)
            return _error(request, 'INTERNAL_ERROR', status=500)
        # Validate schema, real dates, JSON representation and the full byte cap
        # before selecting even an unknown ID. Never return a partial success.
        serialize_material_response(document)
        ids = [item['id'] for item in document['items']]
        if len(ids) != len(set(ids)):
            return _error(request, 'INTERNAL_ERROR', status=500)
        items = [item for item in document['items'] if item['id'] == material_id]
        if not items:
            return _error(request, 'MATERIAL_NOT_FOUND', status=404)
        detail = dict(document, items=items)
        material_detail_validator()(detail)
        body = serialize_material_response(detail)
    except MaterialResponseTooLarge:
        return _error(request, 'RESPONSE_TOO_LARGE', status=500)
    except Exception:
        return _error(request, 'INTERNAL_ERROR', status=500)
    return _http(body)
