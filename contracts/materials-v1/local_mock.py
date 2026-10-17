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
