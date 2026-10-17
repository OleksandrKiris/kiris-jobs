const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const M = require('./model.js');
const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
test('browser entry refuses local execution before loading any browser or git checkout',()=>{
  const result=spawnSync(process.execPath,[path.join(__dirname,'browser-acceptance.mjs')],{
    env:{...process.env,GITHUB_ACTIONS:'false',PLAYWRIGHT_PACKAGE:'must-not-be-loaded'},encoding:'utf8',timeout:5000
  });
  assert.equal(result.status,1);assert.match(result.stderr,/Run only in the approved GitHub Actions/);
  assert.doesNotMatch(result.stderr,/Cannot find module|not a git repository/);
});
test('browser entry follows shared report contract without runtime dependency changes',()=>{
  const source=read('browser-acceptance.mjs');
  assert.match(source,/resolve\(BROWSER_REPORT\)/);assert.doesNotMatch(source,/COORDINATOR_REPORT/);
  assert.match(source,/TESTED_HEAD/);assert.match(source,/TESTED_BASE/);
  assert.match(source,/context\.setOffline\(true\)/);assert.match(source,/assert\.deepEqual\(requests, \[\]\)/);
  assert.match(source,/finally/);assert.match(source,/browser\?\.close\(\)/);
});
function storage(entries=[], fail='') {
  const data = new Map(entries), calls=[];
  const access = (op,key) => {calls.push([op,key]);if(fail==='all'||fail===op)throw Error('denied');};
  return {data,calls,getItem(k){access('get',k);return data.get(k)??null;},setItem(k,v){access('set',k);data.set(k,v);},removeItem(k){access('remove',k);data.delete(k);}};
}
test('fixed demo tasks and filters; unknown ids/statuses do not mutate',()=>{
  const s=storage(),m=M.create(s);assert.deepEqual(m.list(),M.IDS);assert.equal(m.list('done').length,0);
  assert.equal(m.set('person-name','done'),false);assert.equal(m.set('demo-01','approved'),false);
  assert.equal(s.calls.length,1);m.set('demo-01','doing');m.set('demo-02','done');
  assert.deepEqual(m.list('doing'),['demo-01']);assert.deepEqual(m.list('done'),['demo-02']);
});
test('reload restores statuses; snapshots cannot mutate model',()=>{
  const s=storage(),m=M.create(s);m.set('demo-03','done');const n=M.create(s);
  assert.equal(n.snapshot().statuses['demo-03'],'done');const snapshot=n.snapshot();snapshot.statuses['demo-01']='done';
  assert.equal(n.snapshot().statuses['demo-01'],'todo');
  assert.deepEqual(Object.keys(JSON.parse(s.data.get(M.KEY))).sort(),['statuses','version']);
});
test('legacy v1 exact format remains compatible',()=>{
  const raw=JSON.stringify({version:1,statuses:{'demo-01':'doing','demo-02':'done','demo-03':'todo'}});
  const s=storage([[M.KEY,raw]]),m=M.create(s);assert.equal(m.snapshot().persistence,'ready');assert.equal(s.data.get(M.KEY),raw);
});
for(const raw of ['{bad','null','[]',JSON.stringify({version:2,statuses:M.initial()}),JSON.stringify({version:1,statuses:{}}),JSON.stringify({version:1,statuses:{...M.initial(),candidate:'x'}}),JSON.stringify({version:1,statuses:{...M.initial(),'demo-01':'approved'}}),'x'.repeat(2001)]) {
  test('invalid/future storage is preserved: '+raw.slice(0,55),()=>{
    const s=storage([[M.KEY,raw],['unrelated','keep']]),m=M.create(s);assert.equal(m.snapshot().persistence,'invalid');
    m.set('demo-01','done');assert.equal(m.snapshot().statuses['demo-01'],'done');assert.equal(s.data.get(M.KEY),raw);
    assert.equal(m.reset(false),false);assert.equal(s.data.get(M.KEY),raw);assert.equal(m.reset(true),true);
    assert.equal(s.data.has(M.KEY),false);assert.equal(s.data.get('unrelated'),'keep');m.set('demo-02','done');assert.equal(m.snapshot().persistence,'saved');
  });
}
test('denied read/write/remove preserve usable in-memory board and honest state',()=>{
  const m=M.create(storage([], 'all'));assert.equal(m.snapshot().persistence,'blocked');m.set('demo-01','done');
  assert.deepEqual(m.list('done'),['demo-01']);m.reset(true);assert.deepEqual(m.snapshot().statuses,M.initial());assert.equal(m.snapshot().persistence,'blocked');
});
test('write failure preserves old saved record; reload reports actual saved state',()=>{
  const raw=JSON.stringify({version:1,statuses:M.initial()}),s=storage([[M.KEY,raw]],'set'),m=M.create(s);
  m.set('demo-01','done');assert.equal(m.snapshot().persistence,'blocked');assert.equal(s.data.get(M.KEY),raw);assert.equal(M.create(s).snapshot().statuses['demo-01'],'todo');
});
test('denied read never overwrites unseen previous data, even if writes would work',()=>{
  const raw=JSON.stringify({version:1,statuses:{...M.initial(),'demo-02':'done'}}),s=storage([[M.KEY,raw]],'get'),m=M.create(s);
  m.set('demo-01','doing');assert.equal(s.data.get(M.KEY),raw);assert.equal(s.calls.some(([op])=>op==='set'),false);
  m.reset(false);assert.equal(s.data.get(M.KEY),raw);m.reset(true);m.set('demo-03','done');assert.equal(m.snapshot().persistence,'saved');
});
test('unsupported language and alias have deterministic fallback',()=>{
  assert.equal(M.language('ua'),'uk');assert.equal(M.language('UK'),'uk');assert.equal(M.language('ka'),'en');assert.equal(M.language('<script>'),'en');
});
function ui({lang='en',filter='all',store=storage(),historyDenied=false,baseUrl='https://example.test/coordinator-demo/',worker=true}={}) {
  let document;
  class Node {
    constructor(tag){this.tagName=tag;this.children=[];this.handlers={};this.hidden=false;this.value='';this.textContent='';this.id='';this.attrs={};this.dataset={};}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=nodes;}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(type,fn){this.handlers[type]=fn;}
    focus(){document.activeElement=this;}
  }
  const roots=[...read('index.html').matchAll(/id="([^"]+)"/g)].map(([,id])=>{const n=new Node('fixture');n.id=id;return n;});
  const find=(id,nodes)=>{for(const node of nodes){if(node.id===id)return node;const child=find(id,node.children);if(child)return child;}return null;};
  document={documentElement:{},activeElement:null,title:'',createElement:t=>new Node(t),getElementById:id=>find(id,roots),querySelector:()=>({prepend(node){roots.unshift(node);}})};
  const location=new URL(baseUrl+'?lang='+lang+'&status='+filter+'&from=fixture#board');
  const forbidden=()=>{throw Error('External network/operational action forbidden');};
  const window={CoordinatorDemo:M,localStorage:store};const historyCalls=[];
  const history={state:{keep:true},replaceState(s,title,url){if(historyDenied)throw Error('denied');assert.equal(s.keep,true);historyCalls.push(String(url));location.href=String(url);}};
  vm.runInNewContext(read('app.js'),{window,document,location,history,URL,fetch:forbidden,XMLHttpRequest:forbidden,WebSocket:forbidden,navigator:{sendBeacon:forbidden,...(worker?{serviceWorker:{register:forbidden}}:{})}});
  return {document,location,store,historyCalls,$:id=>document.getElementById(id),change(id,value){const n=this.$(id);n.focus();n.value=value;n.handlers.change();},click(id){this.$(id).handlers.click();}};
}
for(const lang of M.LANGS)test(lang+': real UI handlers, filter, focus, language, reload, cancel/reset',()=>{
  const h=ui({lang});assert.equal(h.$('tasks').children.length,3);
  h.change('demo-01','done');assert.equal(h.document.activeElement.id,'demo-01');
  h.change('filter','done');assert.equal(h.$('tasks').children.length,1);
  h.change('language',lang==='en'?'uk':'en');assert.equal(h.$('filter').value,'done');assert.equal(h.$('demo-01').value,'done');
  assert.equal(h.location.searchParams.get('from'),'fixture');assert.equal(h.location.hash,'#board');
  const reload=ui({lang:h.$('language').value,filter:h.$('filter').value,store:h.store});assert.equal(reload.$('demo-01').value,'done');
  h.change('demo-01','doing');assert.equal(h.$('tasks').children.length,0);assert.equal(h.$('empty').hidden,false);assert.equal(h.document.activeElement.id,'filter');
  h.click('reset');assert.equal(h.$('resetConfirm').hidden,false);assert.equal(h.document.activeElement.id,'cancel');
  h.click('cancel');assert.equal(h.$('resetConfirm').hidden,true);assert.equal(M.create(h.store).snapshot().statuses['demo-01'],'doing');
  h.click('reset');h.click('confirm');assert.equal(h.document.activeElement.id,'reset');assert.deepEqual(M.create(h.store).snapshot().statuses,M.initial());
  h.change('filter','all');assert.equal(h.$('tasks').children.length,3);assert.equal(h.$('empty').hidden,true);
});
test('UI language fallback is explicit; invalid filter resets safely; uk/ua links mapped',()=>{
  const h=ui({lang:'ka',filter:'invalid'});assert.equal(h.document.documentElement.lang,'en');assert.equal(h.$('fallback').hidden,false);assert.equal(h.$('filter').value,'all');
  h.change('language','uk');assert.equal(h.$('fallback').hidden,true);const urls=h.$('links').children.map(x=>x.href);
  assert.ok(urls.includes('https://oleksandrkiris.github.io/kiris-jobs/?lang=uk'));assert.ok(urls.includes('https://oleksandrkiris.github.io/citronex-hydra-project/?lang=ua'));
  assert.ok(h.$('links').children.every(x=>x.target==='_blank'&&x.rel==='noopener noreferrer'));
});
test('UI remains interactive with forbidden history and storage',()=>{
  const h=ui({store:storage([],'all'),historyDenied:true});h.change('demo-02','done');h.change('language','pl');h.change('filter','done');
  assert.equal(h.$('tasks').children.length,1);assert.ok(h.$('storage').textContent.includes('niedostępna'));assert.equal(h.historyCalls.length,0);
});
test('UI warns about corrupt storage without clearing it on initial render or edit',()=>{
  const s=storage([[M.KEY,'{broken']]),h=ui({store:s});assert.match(h.$('storage').textContent,/preserved/);h.change('demo-03','done');assert.equal(s.data.get(M.KEY),'{broken');
});
test('runtime has no data network APIs, free text inputs or forms; all assets local',()=>{
  const js=read('app.js')+read('model.js'),html=read('index.html');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|setInterval|innerHTML/);
  assert.doesNotMatch(html,/<form\b|<input\b|https?:\/\//);assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);
  for(const [,name] of html.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(fs.existsSync(path.join(__dirname,name)),name);
  assert.equal(read('primserv-logo.svg'),fs.readFileSync(path.join(__dirname,'../assets/primserv-logo.svg'),'utf8'));
  assert.match(read('style.css'),/max-width:560px/);assert.match(read('style.css'),/focus-visible/);
});


test('downloaded file and source demo never register the online worker',()=>{
  for(const baseUrl of ['file:///tmp/coordinator-demo/index.html','https://example.test/coordinator-demo/']) {
    const h=ui({baseUrl});h.change('demo-01','doing');assert.equal(h.$('demo-01').value,'doing');
    assert.equal(h.$('catalogue-return'),null);
  }
});
test('published demo returns to same-origin catalogue and reports unavailable offline storage honestly',()=>{
  const h=ui({baseUrl:'https://example.test/kiris-jobs/tools/coordinator/',lang:'ka',worker:false});
  assert.equal(h.document.documentElement.lang,'en');
  assert.equal(h.$('catalogue-return').href,'https://example.test/kiris-jobs/?lang=en');
  assert.equal(h.$('offline').dataset.offlineState,'unavailable');
  h.change('demo-02','done');assert.equal(h.$('demo-02').value,'done');
});
