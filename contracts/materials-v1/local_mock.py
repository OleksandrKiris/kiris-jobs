"""Pure local mock and snapshot adapter. No HTTP server, socket or fetch."""
import copy
import json
import re
from pathlib import Path

SNAPSHOT = Path(__file__).with_name('snapshot.json')
LANGUAGES = {'ua','uk','ru','pl','en','ka','tr','hy'}
MAX_BYTES = 32768

def read_snapshot(query=None, snapshot=None):
    query = {} if query is None else query
    def fail(code): return 400, {'code':code,'request_id':'local-contract-test'}
    if not isinstance(query,dict) or set(query)-{'location_id','language','limit','cursor'}:
        return fail('INVALID_QUERY')
    if any(not isinstance(v,str) for v in query.values()): return fail('INVALID_QUERY')
    if query.get('location_id','zgorzelec') != 'zgorzelec': return fail('INVALID_LOCATION')
    requested=query.get('language','en')
    if requested not in LANGUAGES: return fail('INVALID_LANGUAGE')
    limit=query.get('limit','20')
    if not re.fullmatch(r'[1-9][0-9]?',limit) or not 1 <= int(limit) <= 20:
        return fail('INVALID_LIMIT')
    if query.get('cursor',''): return fail('INVALID_CURSOR')
    data=copy.deepcopy(snapshot) if snapshot is not None else json.loads(SNAPSHOT.read_text(encoding='utf-8'))
    data['requested_language']=requested
    # ua stays visible as requested; canonical comparison is uk.
    canonical='uk' if requested=='ua' else requested
    data['effective_language']='ru'
    data['fallback']=canonical != 'ru'
    data['items']=data['items'][:int(limit)]
    if len(json.dumps(data,ensure_ascii=False).encode('utf-8')) > MAX_BYTES:
        return 500, {'code':'RESPONSE_TOO_LARGE','request_id':'local-contract-test'}
    return 200,data

def mock_api(query_pairs=(),method='GET'):
    if method != 'GET': return 405,{'code':'METHOD_NOT_ALLOWED','request_id':'local-contract-test'}
    pairs=list(query_pairs)
    if len({k for k,v in pairs}) != len(pairs):
        return 400,{'code':'INVALID_QUERY','request_id':'local-contract-test'}
    return read_snapshot(dict(pairs))


def mock_detail_api(material_id, query_pairs=(), method='GET', snapshot=None):
    """Offline detail contract; no route/HTTP registration or new source store."""
    def fail(status, code):
        return status, {'code': code, 'request_id': 'local-contract-test'}
    if method != 'GET':
        return fail(405, 'METHOD_NOT_ALLOWED')
    if not isinstance(material_id, str) or re.fullmatch(r'[a-z0-9-]{1,80}', material_id) is None:
        return fail(400, 'INVALID_MATERIAL_ID')
    try:
        pairs = list(query_pairs)
        if any(not isinstance(p, (list, tuple)) or len(p) != 2 for p in pairs):
            return fail(400, 'INVALID_QUERY')
        if any(not isinstance(k, str) or not isinstance(v, str) for k, v in pairs):
            return fail(400, 'INVALID_QUERY')
        if len({k for k, _ in pairs}) != len(pairs):
            return fail(400, 'INVALID_QUERY')
        query = dict(pairs)
        if set(query) - {'location_id', 'language'}:
            return fail(400, 'INVALID_QUERY')
        # Reuse list filter/language rules, before source access.
        status, _ = read_snapshot(query, {'items': []})
        if status != 200:
            return fail(status, _['code'])
    except (TypeError, ValueError):
        return fail(400, 'INVALID_QUERY')
    try:
        from jsonschema import Draft202012Validator, FormatChecker
        from referencing import Registry, Resource
        from referencing.jsonschema import DRAFT202012
        root = SNAPSHOT.parent
        canonical = json.loads((root / 'response.schema.json').read_text(encoding='utf-8'))
        detail = json.loads((root / 'detail-response.schema.json').read_text(encoding='utf-8'))
        Draft202012Validator.check_schema(canonical)
        Draft202012Validator.check_schema(detail)
        uri = 'https://primserv.invalid/materials-v1/response.schema.json'
        registry = Registry().with_resource(uri, Resource.from_contents(canonical, default_specification=DRAFT202012))
        detail = dict(detail, **{'$id': 'https://primserv.invalid/materials-v1/detail-response.schema.json'})
        data = copy.deepcopy(snapshot) if snapshot is not None else json.loads(SNAPSHOT.read_text(encoding='utf-8'))
        Draft202012Validator(canonical, format_checker=FormatChecker(formats=['date']), registry=Registry()).validate(data)
        ids = [item['id'] for item in data['items']]
        if len(ids) != len(set(ids)):
            return fail(500, 'INTERNAL_ERROR')
        status, body = read_snapshot(query, data)
        if status != 200:
            return fail(status, body['code'])
        items = [item for item in body['items'] if item['id'] == material_id]
        if not items:
            return fail(404, 'MATERIAL_NOT_FOUND')
        body['items'] = items
        Draft202012Validator(detail, format_checker=FormatChecker(formats=['date']), registry=registry).validate(body)
        encoded = json.dumps(body, ensure_ascii=False, allow_nan=False, separators=(',', ':')).encode('utf-8')
        if len(encoded) > MAX_BYTES:
            return fail(500, 'RESPONSE_TOO_LARGE')
        return 200, body
    except Exception:
        # Fixed failure, including schema/I/O/encoding faults; no source echo.
        return fail(500, 'INTERNAL_ERROR')
