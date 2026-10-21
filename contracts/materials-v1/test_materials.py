import copy
import hashlib
import json
import re
import unittest
from pathlib import Path
from unittest.mock import patch
from jsonschema import Draft202012Validator, FormatChecker
from local_mock import read_snapshot, mock_api

P=Path(__file__).parent
S=json.loads((P/'snapshot.json').read_text(encoding='utf-8'))
V=Draft202012Validator(json.loads((P/'response.schema.json').read_text()),format_checker=FormatChecker())
E=Draft202012Validator(json.loads((P/'error.schema.json').read_text()),format_checker=FormatChecker())

class MaterialContractTests(unittest.TestCase):
    def assert_two_item_fixture(self, data):
        # Test-only fixture/source integrity, not another runtime validator.
        V.validate(data)
        self.assertEqual([i['id'] for i in data['items']],
                         ['site-cleaning-summary-ru', 'banana-warehouse-poland-summary-ru'])
        self.assertEqual(len({i['id'] for i in data['items']}), len(data['items']))
        self.assertEqual(data['content_version'], '2e80ab811fa3573fc13ac7dd6ee65279865cc58b')
        second = data['items'][1]
        self.assertEqual(second['job_id'], 'banana-warehouse-poland')
        self.assertEqual(second['location_id'], 'zgorzelec')
        self.assertEqual(second['source']['ref'], data['content_version'])
        self.assertEqual(second['source']['selector'], 'jobs[id=banana-warehouse-poland]')
        self.assertEqual(second['source']['verified_on'], '2026-10-18')
        source = (P.parents[1]/'data/content.js').read_text(encoding='utf-8')
        start = source.index('id: "banana-warehouse-poland"')
        block = source[start:source.index('\n    },', start)]
        def field(name):
            return re.search(r'\b' + name + r': "([^"\n]*)"', block).group(1)
        self.assertEqual(second['title'], field('title'))
        self.assertEqual(second['text'], field('summary'))
        self.assertIn('Zgorzelec', field('location').split(' · '))
        self.assertEqual(second['source']['source_updated_on'], field('updatedAt'))

    def test_two_items_preserve_exact_legacy_item_and_source_parity(self):
        self.assert_two_item_fixture(S)
        legacy = json.dumps(S['items'][0], ensure_ascii=False, sort_keys=True,
                            separators=(',', ':')).encode('utf-8')
        self.assertEqual(hashlib.sha256(legacy).hexdigest(),
                         '815ee5ba8ab77c7f80026d401ffbc97d632c281941696a937464de535f9f420f')

    def test_two_item_limits_fallback_and_input_isolation(self):
        original = copy.deepcopy(S)
        with patch('socket.socket', side_effect=AssertionError('network forbidden')):
            for limit, count in [('1', 1), ('2', 2), ('20', 2)]:
                for language in ['ru', 'ua', 'uk', 'en', 'pl', 'ka', 'tr', 'hy']:
                    with self.subTest(limit=limit, language=language):
                        status, body = mock_api([('limit', limit), ('language', language)])
                        self.assertEqual(status, 200)
                        self.assertEqual(body['items'], S['items'][:count])
                        self.assertIsNone(body['next_cursor'])
                        self.assertEqual(body['requested_language'], language)
                        self.assertEqual(body['effective_language'], 'ru')
                        self.assertEqual(body['fallback'], language != 'ru')
                        V.validate(body)
            status, body = read_snapshot({'limit': '2'}, S)
            self.assertEqual(status, 200)
            body['items'][1]['source']['selector'] = 'synthetic-mutation'
        self.assertEqual(S, original)

    def test_duplicate_material_identity_is_not_an_accepted_fixture(self):
        data = copy.deepcopy(S)
        data['items'][1]['id'] = data['items'][0]['id']
        with self.assertRaises(AssertionError):
            self.assert_two_item_fixture(data)

    def test_stale_second_source_or_content_is_not_an_accepted_fixture(self):
        for target, key, value in [('source', 'ref', '0'*40),
                                   ('source', 'selector', 'jobs[id=site-cleaning]'),
                                   ('source', 'source_updated_on', '2026-07-22'),
                                   ('source', 'verified_on', '2026-10-17'),
                                   ('item', 'text', 'synthetic stale summary')]:
            data = copy.deepcopy(S)
            item = data['items'][1]
            (item['source'] if target == 'source' else item)[key] = value
            with self.subTest(key=key), self.assertRaises(AssertionError):
                self.assert_two_item_fixture(data)

    def test_schema_and_fixture(self):
        V.check_schema(V.schema); E.check_schema(E.schema); V.validate(S)
    def test_same_scenario_both_sources_no_network(self):
        with patch('socket.socket',side_effect=AssertionError('network forbidden')):
            for lang in ['ru','ua','uk','en','pl','ka','tr','hy']:
                with self.subTest(language=lang):
                    a=read_snapshot({'language':lang}); b=mock_api([('language',lang)])
                    self.assertEqual(a,b); self.assertEqual(a[0],200); V.validate(a[1])
                    self.assertEqual(a[1]['requested_language'],lang)
                    self.assertEqual(a[1]['fallback'],lang!='ru')
                    self.assertEqual(a[1]['effective_language'],'ru')
    def test_invalid_queries(self):
        for query,code in [({'location_id':'bogatynia'},'INVALID_LOCATION'),({'language':'xx'},'INVALID_LANGUAGE'),({'limit':'0'},'INVALID_LIMIT'),({'limit':'21'},'INVALID_LIMIT'),({'limit':'1.5'},'INVALID_LIMIT'),({'limit':'true'},'INVALID_LIMIT'),({'limit':True},'INVALID_QUERY'),({'cursor':'old'},'INVALID_CURSOR'),({'organization_id':'B'},'INVALID_QUERY')]:
            with self.subTest(query=query):
                status,body=read_snapshot(query); self.assertEqual(status,400)
                E.validate(body); self.assertEqual(body['code'],code)
    def test_duplicate_and_method(self):
        self.assertEqual(mock_api([('language','ru'),('language','en')])[0],400)
        for method in ['POST','PUT','PATCH','DELETE']:
            status,body=mock_api(method=method); self.assertEqual(status,405); E.validate(body)
    def test_negative_schema_and_dates(self):
        for edit in [lambda x:x.pop('schema_version'),lambda x:x.update(schema_version='2.0.0'),lambda x:x['items'][0].update(id='Название'),lambda x:x['items'][0]['source'].update(verified_on='2026-02-30'),lambda x:x['items'][0]['source'].pop('ref')]:
            data=copy.deepcopy(S); edit(data); self.assertTrue(list(V.iter_errors(data)))
    def test_additive_old_client_compatibility(self):
        data=copy.deepcopy(S); data['future_optional']='extra';data['items'][0]['future_optional']='extra'
        V.validate(data)
        old=lambda x:(x['items'][0]['id'],x['items'][0]['text'],x['effective_language'])
        self.assertEqual(old(data),old(S))
    def test_size_bound_and_no_mutation(self):
        data=copy.deepcopy(S); data['padding']='x'*33000
        status,body=read_snapshot(snapshot=data);self.assertEqual(status,500); E.validate(body)
        read_snapshot({'language':'ua'},S);self.assertEqual(S['requested_language'],'ru')
    def test_pinned_source_bytes(self):
        source=(P.parents[1]/'data/content.js').read_text(encoding='utf-8')
        item=S['items'][0]
        start=source.index('id: "site-cleaning"');end=source.index('\n    },',start)
        block=source[start:end]
        for value in [item['title'],item['text'],'location: "Zgorzelec"','updatedAt: "2026-07-23"']:
            self.assertIn(value,block)
    def test_openapi_references(self):
        spec=json.loads((P/'openapi.json').read_text())
        self.assertEqual(spec['openapi'],'3.1.1'); self.assertEqual(spec['security'],[])
        for response in spec['paths']['/api/v1/materials/']['get']['responses'].values():
            ref=response['content']['application/json']['schema']['$ref']
            self.assertTrue((P/ref).is_file())

if __name__ == '__main__': unittest.main()
