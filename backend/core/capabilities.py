"""Bounded local capabilities derived from accepted repository metadata."""
import json
from pathlib import Path

from django.http import HttpResponse
from jsonschema import Draft202012Validator
from referencing import Registry

from . import protocol
from .views import api_error


CONTRACTS = Path(__file__).resolve().parents[2] / 'contracts'
MATERIAL_OPENAPI_PATH = CONTRACTS / 'materials-v1' / 'openapi.json'
CAPABILITIES_SCHEMA_PATH = CONTRACTS / 'capabilities-v1' / 'response.schema.json'
MAX_CAPABILITIES_RESPONSE_BYTES = 4096


class CapabilitiesMetadataError(ValueError):
    """Canonical capabilities metadata is unavailable or inconsistent."""


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Canonical JSON contains duplicate keys.')
        result[key] = value
    return result


def _reject_constant(value):
    raise ValueError('Canonical JSON contains a nonfinite number.')


def _read_json(path):
    return json.loads(path.read_text(encoding='utf-8'),
                      object_pairs_hook=_unique_object, parse_constant=_reject_constant)


def capabilities_document():
    """Return a fresh validated document; no request/settings/provider input."""
    try:
        spec = _read_json(MATERIAL_OPENAPI_PATH)
        parameters = spec['paths']['/api/v1/materials/']['get']['parameters']
        if type(parameters) is not list:
            raise ValueError('Canonical query parameters must be a list.')
        selected = {}
        for parameter in parameters:
            if type(parameter) is not dict:
                raise ValueError('Canonical query parameter must be an object.')
            if parameter.get('in') == 'query' and parameter.get('name') in ('language', 'limit'):
                name = parameter['name']
                if name in selected:
                    raise ValueError('Canonical query parameter is duplicated.')
                selected[name] = parameter['schema']
        language = selected['language']
        limit = selected['limit']
        languages = language['enum']
        maximum = limit['maximum']
        if (language.get('type') != 'string' or type(languages) is not list
                or not languages or any(type(code) is not str or not code for code in languages)
                or len(set(languages)) != len(languages)):
            raise ValueError('Canonical languages are invalid.')
        if limit.get('type') != 'integer' or type(maximum) is not int or maximum <= 0:
            raise ValueError('Canonical limit is invalid.')
        document = {
            'api_version': protocol.API_VERSION,
            'service': protocol.SERVICE_NAME,
            'version': protocol.SERVICE_VERSION,
            'capabilities': {'materials': {
                'contract': 'materials-v1', 'path': '/api/v1/materials/',
                'methods': ['GET'], 'languages': list(languages), 'max_limit': maximum,
            }},
            'data_source': 'local_mock',
        }
        schema = _read_json(CAPABILITIES_SCHEMA_PATH)
        Draft202012Validator.check_schema(schema)
        Draft202012Validator(schema, registry=Registry()).validate(document)
    except Exception:
        pass
    else:
        return document
    # Outside except: even pure callers do not retain path/schema/input context.
    raise CapabilitiesMetadataError('Capabilities metadata is unavailable.')


def _headers(response):
    response['Content-Length'] = str(len(response.content))
    response['Cache-Control'] = 'no-store'
    response['X-Content-Type-Options'] = 'nosniff'
    return response


def capabilities(request):
    """Describe the local mock; existing guards supply trusted IDs and logs."""
    if request.method != 'GET':
        response = api_error('method_not_allowed', 'Only GET is allowed.', status=405)
        response['Allow'] = 'GET'
        return _headers(response)
    try:
        document = capabilities_document()
        body = json.dumps(document, ensure_ascii=False, allow_nan=False,
                          separators=(',', ':')).encode('utf-8')
        if len(body) > MAX_CAPABILITIES_RESPONSE_BYTES:
            raise ValueError('Capabilities response exceeds its byte limit.')
    except Exception:
        return _headers(api_error('internal_error', 'The request could not be completed.', status=500))
    return _headers(HttpResponse(body, content_type='application/json; charset=utf-8'))
