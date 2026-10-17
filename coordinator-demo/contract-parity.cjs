// Explicit read-only integration check against a separately supplied role-14 tree.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const M=require('./model.js');
const dir=path.resolve(process.argv[2]||'contracts/materials-v1');
assert.deepEqual(M.materialSnapshot({language:'ru'}),JSON.parse(fs.readFileSync(path.join(dir,'snapshot.json'),'utf8')));
const code=`import json,sys
sys.path.insert(0,sys.argv[1])
from local_mock import mock_api
rows=[]
for language in ['ru','ua','uk','en','pl','ka','tr','hy']:
 for limit in [1,20]:
  status,data=mock_api([('location_id','zgorzelec'),('language',language),('limit',str(limit))])
  assert status==200
  rows.append({'query':{'location_id':'zgorzelec','language':language,'limit':limit},'response':data})
print(json.dumps(rows,ensure_ascii=False))`;
const result=spawnSync('python',['-B','-c',code,dir],{encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8'}});
assert.equal(result.status,0,result.stderr);
const rows=JSON.parse(result.stdout);
for(const {query,response} of rows) {
  assert.deepEqual(M.materialReader().read(query),response);
  assert.deepEqual(M.materialReader({mode:'mock',mock:()=>JSON.stringify(response)}).read(query),response);
}
console.log(`PASS: source fixture + ${rows.length} role-14 Python mock / frontend snapshot / frontend mock comparisons`);
