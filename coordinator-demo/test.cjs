const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const M = require('./model.js');
const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
const {seedFixture,seedNativeFixture,installFixtureHooks,acceptanceStatus}=require('./browser-fixtures.cjs');

function nativeFixtureRealm(data=new Map()) {
  const calls=[];let allowed=false;
  class Storage {
    getItem(k){calls.push(['getItem',k]);return data.get(k)??null;}
    setItem(k,v){calls.push(['setItem',k,v]);data.set(k,v);}
    removeItem(k){calls.push(['removeItem',k]);data.delete(k);}
  }
  const area=new Storage(),browserWindow={};
  const access=()=>{if(!allowed)throw Error('Storage accessed before document readiness');return area;};
  Object.defineProperty(browserWindow,'localStorage',{configurable:true,get:access});
  const sandbox={window:browserWindow,Storage,DOMException,
    location:{href:'file:///fixture/index.html?lang=en'},document:{readyState:'loading'},
    performance:{timeOrigin:1,now:()=>2,getEntriesByType:()=>[{type:'reload'}]}};
  Object.defineProperty(sandbox,'localStorage',{get:access});
  const context=vm.createContext(sandbox);
  return {calls,data,area,window:browserWindow,
    run(fn,args){context.args=args;return vm.runInContext('('+fn.toString()+')(args)',context);},
    ready(){allowed=true;sandbox.document.readyState='complete';},
    model(){browserWindow.CoordinatorDemo=M;return browserWindow.CoordinatorDemo.create({
      getItem:k=>browserWindow.localStorage.getItem(k),
      setItem:(k,v)=>browserWindow.localStorage.setItem(k,v),
      removeItem:k=>browserWindow.localStorage.removeItem(k)
    });}
  };
}
const nativeArgs=(mode='v1',observe=false)=>({key:M.KEY,other:'fixture:other',mode,observe,
  previous:JSON.stringify({version:1,statuses:{...M.initial(),'demo-02':'done'}})});

test('native fixture provisioning rejects an unready document before any storage access',()=>{
  const h=nativeFixtureRealm();
  assert.throws(()=>h.run(seedNativeFixture,nativeArgs()),/requires a ready file document/);
  assert.deepEqual(h.calls,[]);
});

test('all reload observation and denial hooks install without touching early storage',()=>{
  for(const observe of [false,'passive','preseed'])for(const mode of ['empty','v1','corrupt','future','denied-read','denied-write','denied-remove']) {
    const h=nativeFixtureRealm();
    assert.doesNotThrow(()=>h.run(installFixtureHooks,nativeArgs(mode,observe)));
    assert.deepEqual(h.calls,[]);
  }
});

test('ready preparation seeds once; reload hooks cannot replace edited or missing native state',()=>{
  for(const lost of [false,true]) {
    const h=nativeFixtureRealm(),args=nativeArgs();h.ready();h.run(seedNativeFixture,args);
    h.model().set('demo-01','doing');
    const marker='primserv:acceptance:coordinator-seeded';h.data.delete(marker);
    if(lost)h.data.delete(M.KEY);
    const next=nativeFixtureRealm(h.data);next.run(installFixtureHooks,args);
    assert.deepEqual(next.calls,[]);next.ready();
    const model=next.model();
    assert.equal(model.snapshot().statuses['demo-01'],lost?'todo':'doing');
    assert.equal(model.snapshot().statuses['demo-02'],lost?'todo':'done');
    assert.deepEqual(next.calls,[['getItem',M.KEY]]);
    assert.equal(next.data.has(marker),false);
  }
});

test('native preparation preserves existing unknown records and labels its optional read',()=>{
  for(const raw of ['{broken',JSON.stringify({version:2,statuses:{}})]) {
    const h=nativeFixtureRealm(new Map([[M.KEY,raw]]));h.ready();
    const prep=h.run(seedNativeFixture,nativeArgs('v1','preseed'));
    assert.equal(h.data.get(M.KEY),raw);assert.equal(prep.preSeedProbe.raw,raw);
    assert.equal(prep.preSeedProbe.addedReads,1);
    assert.equal(h.data.get('fixture:other'),'keep');
  }
});

function fakeIdentityContext(failMethod='',key='file-key') {
  const sends=[];let detached=0;
  const results={'Browser.getVersion':{product:'Chrome/141.0.7390.37',protocolVersion:'1.3'},
    'Page.getFrameTree':{frameTree:{frame:{id:'frame-a',loaderId:'loader-a',url:'file:///test/index.html#board',securityOrigin:'file://'}}},
    'Target.getTargetInfo':{targetInfo:{targetId:'target-a'}},
    'Storage.getStorageKeyForFrame':{storageKey:key}};
  const context={async newCDPSession(){return {async send(method,params){
    sends.push({method,params});if(method===failMethod)throw Error('unsupported method');return results[method];
  },async detach(){detached++;}};}};
  return {context,sends,get detached(){return detached;}};
}

test('identity probe records four literal read-only requests/results and actual version, no DOM/storage evaluation',async()=>{
  const {captureStorageIdentity}=await import('./storage-identity.mjs');const h=fakeIdentityContext();
  const r=await captureStorageIdentity(h.context,{});
  assert.equal(r.status,'observed');assert.equal(h.detached,1);
  assert.deepEqual(h.sends,[{method:'Browser.getVersion',params:{}},{method:'Page.getFrameTree',params:{}},
    {method:'Target.getTargetInfo',params:{}},{method:'Storage.getStorageKeyForFrame',params:{frameId:'frame-a'}}]);
  assert.equal(r.identity.product,'Chrome/141.0.7390.37');assert.equal(r.identity.browserContextId,null);
  assert.equal(r.requests[3].result.storageKey,'file-key');
});

test('unsupported or empty identity stays unavailable and debugger is detached without retries',async()=>{
  const {captureStorageIdentity}=await import('./storage-identity.mjs');
  for(const h of [fakeIdentityContext('Storage.getStorageKeyForFrame'),fakeIdentityContext('','')]) {
    const r=await captureStorageIdentity(h.context,{});assert.equal(r.status,'unavailable');
    assert.equal(h.sends.length,4);assert.equal(h.detached,1);
  }
  const r=await captureStorageIdentity({async newCDPSession(){throw Error('attach unavailable');}},{});
  assert.equal(r.status,'unavailable');assert.equal(r.requests.length,0);assert.match(r.error.message,/attach unavailable/);
});

test('identity comparison distinguishes reported keys without treating frame/loader changes as a cause',async()=>{
  const {captureStorageIdentity,compareStorageIdentity}=await import('./storage-identity.mjs');
  const a=await captureStorageIdentity(fakeIdentityContext().context,{});
  const b=structuredClone(a);b.identity.frameId='new-frame';b.identity.loaderId='new-loader';
  assert.equal(compareStorageIdentity(a,b),'same-reported-target-and-storage-key');
  b.identity.storageKey='other';assert.equal(compareStorageIdentity(a,b),'different-reported-storage-key');
  b.identity.product='different';assert.equal(compareStorageIdentity(a,b),'incomparable-version');
  assert.equal(compareStorageIdentity(a,{status:'unavailable'}),'unavailable');
});

test('identity availability gate rejects missing, duplicate or unavailable measurements',async()=>{
  const {captureStorageIdentity,hasCompleteIdentity}=await import('./storage-identity.mjs');
  const a=await captureStorageIdentity(fakeIdentityContext().context,{});
  const before={...a,scenario:'observed',phase:'before-state-reload'},after={...a,scenario:'observed',phase:'after-state-reload'};
  assert.equal(hasCompleteIdentity([before,after],['observed']),true);
  for(const samples of [[],[before],[before,before],[before,{...after,status:'unavailable'}]])assert.equal(hasCompleteIdentity(samples,['observed']),false);
  const runner=read('browser-acceptance.mjs');assert.match(runner,/if\(report\.identityGate\.status!=='observed'\)report\.status='failed'/);
});

test('file profiles are isolated and restart the same native directory without replaying state',async()=>{
  const {createFileProfile}=await import('./browser-profile.mjs');
  const launches=[],closes=[];
  const chromium={async launchPersistentContext(directory,options){
    launches.push({directory,options});
    return {async close(){closes.push(directory);}};
  }};
  const first=await createFileProfile(chromium,{width:320,height:900});
  const second=await createFileProfile(chromium,{width:1280,height:900});
  try {
    assert.notEqual(first.directory,second.directory);
    assert.ok(fs.existsSync(first.directory));
    await first.reopen();
    assert.equal(launches[2].directory,launches[0].directory);
    assert.deepEqual(launches[2].options,{headless:true,viewport:{width:320,height:900}});
    assert.deepEqual(closes,[first.directory]);
  } finally {await first.dispose();await second.dispose();}
  assert.equal(fs.existsSync(first.directory),false);
  assert.equal(fs.existsSync(second.directory),false);
});

test('file profile launch failures remove the newly allocated directory',async()=>{
  const {createFileProfile}=await import('./browser-profile.mjs');
  let directory;
  await assert.rejects(createFileProfile({async launchPersistentContext(dir){directory=dir;throw Error('launch failed');}},{}),/launch failed/);
  assert.equal(fs.existsSync(directory),false);
});

test('profile ownership cleans directory when route, tracing or page setup fails',async()=>{
  const {withFileProfile}=await import('./browser-profile.mjs');
  assert.equal((read('browser-acceptance.mjs').match(/await withFileProfile\(/g)||[]).length,2);
  assert.doesNotMatch(read('browser-acceptance.mjs'),/const profile = await createFileProfile/);
  for(const phase of ['route','tracing','newPage']) {
    let directory,closes=0;
    const fail=stage=>{if(phase===stage)throw Error(stage+' setup failed');};
    const context={async close(){closes++;},async route(){fail('route');},
      tracing:{async start(){fail('tracing');}},async newPage(){fail('newPage');}};
    const chromium={async launchPersistentContext(dir){directory=dir;return context;}};
    await assert.rejects(withFileProfile(chromium,{width:320,height:900},async profile=>{
      await profile.context.route();await profile.context.tracing.start();await profile.context.newPage();
    }),new RegExp(phase+' setup failed'));
    assert.equal(closes,1,phase);assert.equal(fs.existsSync(directory),false,phase);
  }
});

test('file profile restart failures still allow cleanup',async()=>{
  const {createFileProfile}=await import('./browser-profile.mjs');
  let launches=0;
  const profile=await createFileProfile({async launchPersistentContext(){
    if(launches++)throw Error('restart failed');
    return {async close(){}};
  }},{});
  await assert.rejects(profile.reopen(),/restart failed/);
  await profile.dispose();
  assert.equal(fs.existsSync(profile.directory),false);
});

function observedDocument(data,observe=false,mode='v1') {
  const calls=[];
  class Storage {
    getItem(k){calls.push(['getItem',k]);return data.get(k)??null;}
    setItem(k,v){calls.push(['setItem',k,v]);data.set(k,v);}
    removeItem(k){calls.push(['removeItem',k]);data.delete(k);}
  }
  const area=new Storage(), browserWindow={localStorage:area};
  const args={key:M.KEY,other:'fixture:other',mode,observe,
    previous:JSON.stringify({version:1,statuses:{...M.initial(),'demo-02':'done'}})};
  vm.runInNewContext('('+seedFixture.toString()+')(args)',{
    args,window:browserWindow,localStorage:area,Storage,DOMException,
    location:{href:'file:///fixture/index.html?lang=en'},document:{readyState:'loading'},
    performance:{timeOrigin:1,now:()=>2,getEntriesByType:()=>[{type:'reload'}]}
  });
  browserWindow.CoordinatorDemo=M;
  const model=browserWindow.CoordinatorDemo.create(area);
  return {calls,area,model,window:browserWindow};
}

test('passive observer preserves exact storage operation sequence and real model state',()=>{
  const control=observedDocument(new Map()), passive=observedDocument(new Map(),'passive');
  control.model.set('demo-01','doing');passive.model.set('demo-01','doing');
  assert.deepEqual(passive.calls,control.calls);
  assert.deepEqual(passive.model.snapshot(),control.model.snapshot());
  assert.equal(passive.window.__coordinatorObservedModel,passive.model);
  assert.equal(control.window.__coordinatorObservedModel,undefined);
  const evidence=passive.window.__coordinatorEvidence;
  assert.equal(evidence.preSeedProbe,undefined);
  assert.equal(evidence.navigation,'reload');
  assert.equal(evidence.events[0].key,'primserv:acceptance:coordinator-seeded');
  assert.equal(evidence.events[0].result,null);
  assert.equal(evidence.events.at(-1).phase,'app');
  assert.equal(evidence.events.at(-1).operation,'setItem');
});

test('explicit pre-seed observer adds exactly one labelled read, not an implicit flush fix',()=>{
  const passive=observedDocument(new Map(),'passive'), active=observedDocument(new Map(),'preseed');
  assert.equal(active.calls.length,passive.calls.length+1);
  assert.deepEqual(active.calls.filter((_,i)=>i!==1),passive.calls);
  assert.equal(active.window.__coordinatorEvidence.preSeedProbe.raw,null);
  assert.equal(active.window.__coordinatorEvidence.preSeedProbe.marker,null);
  assert.equal(active.window.__coordinatorEvidence.preSeedProbe.addedReads,1);
  assert.deepEqual(active.model.snapshot(),passive.model.snapshot());
});

test('observations distinguish continuous, fresh and stale storage with identical v1 DOM possibilities',()=>{
  const marker='primserv:acceptance:coordinator-seeded';
  const raw=status=>JSON.stringify({version:1,statuses:{...M.initial(),'demo-01':status,'demo-02':'done'}});
  for(const [kind,data,expected,writes] of [
    ['continuous',new Map([[marker,'yes'],[M.KEY,raw('doing')]]),'doing',0],
    ['fresh',new Map(),'todo',1],
    ['stale',new Map([[marker,'yes'],[M.KEY,raw('todo')]]),'todo',0]
  ]) {
    const h=observedDocument(data,'preseed'),e=h.window.__coordinatorEvidence;
    assert.equal(h.model.snapshot().statuses['demo-01'],expected,kind);
    assert.equal(h.model.snapshot().statuses['demo-02'],'done',kind);
    assert.equal(e.events.filter(x=>x.phase==='fixture'&&x.operation==='setItem'&&x.key===M.KEY).length,writes,kind);
    assert.equal(e.initialModel.statuses['demo-01'],expected,kind);
    assert.equal(e.preSeedProbe.raw,kind==='fresh'?null:raw(expected),kind);
  }
});

test('continuing independent scenarios retains any failure and zero-test failure',()=>{
  assert.equal(acceptanceStatus([]),'failed');
  assert.equal(acceptanceStatus([{status:'passed'},{status:'failed'},{status:'passed'}]),'failed');
  assert.equal(acceptanceStatus([{status:'passed'},{status:'unknown'}]),'failed');
  assert.equal(acceptanceStatus([{status:'passed'}]),'passed');
});

function fixtureDocument(data,mode,previous) {
  // A new document has new prototypes/session storage, while local state survives.
  class Storage {
    getItem(k){return data.get(k)??null;}
    setItem(k,v){data.set(k,v);}
    removeItem(k){data.delete(k);}
  }
  const localStorage=new Storage();
  vm.runInNewContext('('+seedFixture.toString()+')(args)',{
    localStorage,Storage,window:{},DOMException,
    args:{key:M.KEY,other:'fixture:unrelated',mode,previous}
  });
  return localStorage;
}

test('fixture survives missing session marker and keeps denied-remove state across documents',()=>{
  const previous=JSON.stringify({version:1,statuses:{...M.initial(),'demo-02':'done'}});
  const data=new Map(),first=fixtureDocument(data,'denied-remove',previous);
  const model=M.create(first);model.set('demo-01','doing');model.reset(true);
  assert.equal(model.snapshot().statuses['demo-01'],'todo');
  assert.equal(model.snapshot().persistence,'blocked');
  assert.equal(JSON.parse(data.get(M.KEY)).statuses['demo-01'],'doing');
  const second=fixtureDocument(data,'denied-remove',previous);
  assert.equal(M.create(second).snapshot().statuses['demo-01'],'doing');
  assert.equal(M.create(second).snapshot().statuses['demo-02'],'done');
  assert.throws(()=>second.removeItem(M.KEY),/Denied fixture/);
  assert.equal(data.get('fixture:unrelated'),'keep');
});

test('missing local fixture marker cannot overwrite corrupt, future or edited records',()=>{
  for(const raw of ['{broken',JSON.stringify({version:2,statuses:{}}),JSON.stringify({version:1,statuses:{...M.initial(),'demo-01':'doing'}})]) {
    const data=new Map([[M.KEY,raw]]);
    fixtureDocument(data,'v1','replacement');
    assert.equal(data.get(M.KEY),raw);
  }
});

test('material snapshot reproduces accepted source text and historical source date',()=>{
  const scope={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/content.js'),'utf8'),scope);
  const source=scope.window.PORTAL_CONTENT.jobs.find(x=>x.id==='site-cleaning');
  const response=M.materialReader().read();const item=response.items[0];
  assert.equal(item.title,source.title);assert.equal(item.text,source.summary);
  assert.equal(item.source.source_updated_on,source.updatedAt);
  assert.equal(source.location,'Zgorzelec');assert.equal(item.location_id,'zgorzelec');
  assert.equal(item.source.ref,M.CONTENT_VERSION);assert.equal(item.synthetic,false);
  assert.equal(item.source.verification_status,'verified-against-repository');
  assert.equal(item.source.verified_on,'2026-10-17');
});

test('snapshot and local JSON mock agree for aliases, fallback and distinct locations',()=>{
  const snapshot=M.materialReader();
  const mock=M.materialReader({mode:'mock',mock:q=>JSON.stringify(M.materialSnapshot(q))});
  for(const language of ['ru','ua','uk','en','pl','ka','tr','hy'])for(const location_id of ['zgorzelec']) {
    const q={language,location_id,limit:1};const response=snapshot.read(q);
    assert.deepEqual(mock.read(q),response);
    assert.equal(response.requested_language,language);assert.equal(response.effective_language,'ru');
    assert.equal(response.fallback,language!=='ru');
    assert.equal(response.items.length,1);
  }
});

test('material request boundaries reject malformed language, pagination and limits',()=>{
  for(const mode of ['snapshot','mock']) {
    const reader=M.materialReader({mode,mock:q=>JSON.stringify(M.materialSnapshot(q))});
    for(const q of [{limit:0},{limit:21},{limit:'1'},{cursor:'next'},{language:'RU'},{language:'../ru'},{language:'de'},{location_id:'bogatynia'},{location_id:'Zgorzelec'},{location_id:''},{unknown:1},null])
      assert.throws(()=>reader.read(q),/invalid_request/);
  }
  assert.throws(()=>M.materialReader({mode:'online'}),/online_disabled/);
  assert.throws(()=>M.materialReader({mode:'mock'}),/online_disabled/);
});

test('mock rejects damaged, excessive, unverified, foreign or synthetic material responses',()=>{
  const valid=M.materialSnapshot();
  const changed=fn=>{const x=structuredClone(valid);fn(x);return JSON.stringify(x);};
  for(const raw of ['{bad','null','x'.repeat(12001),changed(x=>x.items[0].location_id='bogatynia'),
    changed(x=>x.items[0].source.ref='a'.repeat(40)),changed(x=>x.items[0].synthetic=true),
    changed(x=>x.items[0].source.verification_status='unverified'),changed(x=>x.items[0].text='invented'),
    changed(x=>delete x.items[0].text),changed(x=>x.schema_version='2.0.0')])
    assert.throws(()=>M.materialReader({mode:'mock',mock:()=>raw}).read(),/invalid_response/);
  // Order is not part of JSON wire compatibility.
  const reorder=Object.fromEntries(Object.entries(valid).reverse());
  assert.deepEqual(M.materialReader({mode:'mock',mock:()=>JSON.stringify(reorder)}).read(),valid);
  const additive=structuredClone(valid);additive.items[0].future_field='allowed';
  assert.deepEqual(M.materialReader({mode:'mock',mock:()=>JSON.stringify(additive)}).read(),additive);
  additive.items[0].future_field='я'.repeat(17000);
  assert.throws(()=>M.materialReader({mode:'mock',mock:()=>JSON.stringify(additive)}).read(),/invalid_response/);
});

test('read results cannot mutate later source reads; search is bounded and has honest no-match',()=>{
  const reader=M.materialReader(),r=reader.read();r.items[0].text='changed';
  assert.notEqual(reader.read().items[0].text,'changed');
  assert.equal(M.searchMaterials(reader.read(),' УБОРКА   отходов ').length,1);
  assert.equal(M.searchMaterials(reader.read(),'bogatynia').length,0);
  assert.equal(M.searchMaterials(reader.read(),'несуществующий ответ').length,0);
  assert.throws(()=>M.searchMaterials(reader.read(),'x'.repeat(121)),/invalid_query/);
});
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
function ui({lang='en',filter='all',store=storage(),historyDenied=false,baseUrl='https://example.test/coordinator-demo/',worker=true,href}={}) {
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
  const location=new URL(href||baseUrl+'?lang='+lang+'&status='+filter+'&from=fixture#board');
  const forbidden=()=>{throw Error('External network/operational action forbidden');};
  const window={CoordinatorDemo:M,localStorage:store};const historyCalls=[];
  const history={state:{keep:true},replaceState(s,title,url){if(historyDenied)throw Error('denied');assert.equal(s.keep,true);historyCalls.push(String(url));location.href=String(url);}};
  vm.runInNewContext(read('app.js'),{window,document,location,history,URL,URLSearchParams,fetch:forbidden,XMLHttpRequest:forbidden,WebSocket:forbidden,navigator:{sendBeacon:forbidden,...(worker?{serviceWorker:{register:forbidden}}:{})}});
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
test('URL language case is normalized for material request without losing ua alias or raw URL',()=>{
  const ru=ui({lang:'RU'});
  assert.equal(ru.document.documentElement.lang,'ru');
  assert.equal(ru.$('materialsStatus').textContent,'ru · Zgorzelec');
  assert.equal(ru.location.searchParams.get('lang'),'RU');
  for(const raw of ['UA','Ua','ua']) {
    const uk=ui({lang:raw});
    assert.equal(uk.document.documentElement.lang,'uk');
    assert.match(uk.$('materialsStatus').textContent,/ua.*ru/);
    assert.equal(uk.location.searchParams.get('lang'),raw);
    uk.change('materialsSource','mock');
    assert.match(uk.$('materialsStatus').textContent,/ua.*ru/);
  }
  const en=ui({lang:'EN'});
  assert.equal(en.document.documentElement.lang,'en');
  assert.match(en.$('materialsStatus').textContent,/en.*ru/);
});

test('source UI searches locally with honest fallback, no answer, and pinned safe link',()=>{
  const h=ui({lang:'ua'});
  assert.match(h.$('materialsStatus').textContent,/ua.*ru/);
  assert.equal(h.$('materials').children.length,1);
  const article=h.$('materials').children[0];
  h.change('materialsSource','mock');
  assert.equal(h.$('materialsSource').value,'mock');
  assert.equal(h.$('materials').children[0].children[1].textContent,article.children[1].textContent);
  assert.equal(article.children[0].lang,'ru');
  assert.equal(article.children[3].href,'https://github.com/OleksandrKiris/kiris-jobs/blob/'+M.CONTENT_VERSION+'/data/content.js');
  assert.equal(article.children[3].rel,'noopener noreferrer');
  h.$('materialQuery').value='bogatynia';h.$('materialQuery').handlers.input();
  assert.equal(h.$('materials').children.length,0);assert.match(h.$('materialsStatus').textContent,/не знайдено/);
  h.$('materialQuery').value='отходов';h.$('materialQuery').handlers.input();
  assert.equal(h.$('materials').children.length,1);
  h.change('language','en');assert.equal(h.$('materialQuery').value,'отходов');
  assert.match(h.$('materialsStatus').textContent,/en.*ru/);
  // Query stays in memory: no new saved data and no search text in URL.
  assert.equal(h.store.calls.filter(x=>x[0]!=='get').length,0);
  assert.doesNotMatch(h.location.href,/%D0%BE%D1%82/);
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
test('runtime has no data network APIs or forms; only bounded local search; all assets local',()=>{
  const js=read('app.js')+read('model.js'),html=read('index.html');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|setInterval|innerHTML/);
  assert.doesNotMatch(html,/<form\b|https?:\/\//);assert.equal((html.match(/<input\b/g)||[]).length,1);
  assert.match(html,/<input id="materialQuery" type="search" maxlength="120">/);assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);
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

test('file view changes keep the original file query and restore through fragment on reload',()=>{
  const h=ui({baseUrl:'file:///tmp/coordinator-demo/index.html'});
  const query=h.location.search,pathname=h.location.pathname;
  h.change('demo-01','done');h.change('filter','done');h.change('language','uk');
  assert.equal(h.location.search,query);assert.equal(h.location.pathname,pathname);
  assert.equal(h.location.hash,'#board?lang=uk&status=done');
  const reload=ui({href:h.location.href,store:h.store});
  assert.equal(reload.document.documentElement.lang,'uk');
  assert.equal(reload.$('filter').value,'done');assert.equal(reload.$('demo-01').value,'done');
  reload.change('filter','all');
  const again=ui({href:reload.location.href,store:h.store});
  assert.equal(again.$('filter').value,'all');assert.equal(again.$('tasks').children.length,3);
});

test('file all-filter fragment overrides a legacy done query without changing the storage address',()=>{
  const h=ui({href:'file:///tmp/coordinator-demo/index.html?lang=ru&status=done&from=fixture#board?lang=pl&status=all'});
  assert.equal(h.document.documentElement.lang,'pl');assert.equal(h.$('filter').value,'all');
  h.change('language','en');
  assert.equal(h.location.search,'?lang=ru&status=done&from=fixture');
  assert.equal(h.location.hash,'#board?lang=en&status=all');
});
test('materials honor file fragment alias while preserving query and restoring task context',()=>{
  const h=ui({href:'file:///tmp/coordinator-demo/index.html?lang=RU&from=legacy#board?lang=UA&status=all'});
  const query=h.location.search,path=h.location.pathname;
  assert.equal(h.document.documentElement.lang,'uk');
  assert.match(h.$('materialsStatus').textContent,/ua.*ru/);
  h.change('materialsSource','mock');assert.match(h.$('materialsStatus').textContent,/ua.*ru/);
  h.change('demo-01','done');h.change('filter','done');h.change('language','pl');
  assert.equal(h.location.search,query);assert.equal(h.location.pathname,path);
  assert.equal(h.location.hash,'#board?lang=pl&status=done');
  const reload=ui({href:h.location.href,store:h.store});
  assert.equal(reload.$('demo-01').value,'done');assert.equal(reload.$('filter').value,'done');
  assert.match(reload.$('materialsStatus').textContent,/pl.*ru/);
  assert.equal(reload.$('materialsSource').value,'snapshot');
  assert.equal(reload.$('materials').children.length,1);
});

test('published demo returns to same-origin catalogue and reports unavailable offline storage honestly',()=>{
  const h=ui({baseUrl:'https://example.test/kiris-jobs/tools/coordinator/',lang:'ka',worker:false});
  assert.equal(h.document.documentElement.lang,'en');
  assert.equal(h.$('catalogue-return').href,'https://example.test/kiris-jobs/?lang=en');
  assert.equal(h.$('offline').dataset.offlineState,'unavailable');
  h.change('demo-02','done');assert.equal(h.$('demo-02').value,'done');
});

test('last material stores exactly whitelist ID, requested language and version; no automatic write',()=>{
 const s=storage(),m=M.materialMemory(s);assert.equal(m.snapshot().entry,null);assert.deepEqual(s.calls,[['get',M.LAST_MATERIAL_KEY]]);
 assert.equal(m.remember('site-cleaning-summary-ru','ua'),true);
 assert.deepEqual(JSON.parse(s.data.get(M.LAST_MATERIAL_KEY)),{version:1,material_id:'site-cleaning-summary-ru',requested_language:'ua'});
 const entry=m.snapshot().entry;entry.material_id='other';assert.equal(m.snapshot().entry.material_id,'site-cleaning-summary-ru');
 assert.equal(m.remember('candidate-id','ru'),false);assert.equal(m.remember('site-cleaning-summary-ru','RU'),false);
 assert.equal(s.data.has(M.KEY),false);assert.equal(M.materialMemory(s).snapshot().entry.requested_language,'ua');
});
test('last material corrupt/future/extra fields remain untouched until explicit clear',()=>{
 for(const raw of ['{bad','null','[]','x'.repeat(257),JSON.stringify({version:2,material_id:'site-cleaning-summary-ru',requested_language:'ru'}),JSON.stringify({version:1,material_id:'site-cleaning-summary-ru',requested_language:'ru',query:'private'}),JSON.stringify({version:1,material_id:'site-cleaning-summary-ru',requested_language:'unknown'})]){
  const s=storage([[M.LAST_MATERIAL_KEY,raw],['other','keep']]),m=M.materialMemory(s);assert.equal(m.snapshot().persistence,'invalid');assert.equal(m.snapshot().entry,null);
  m.remember('site-cleaning-summary-ru','pl');assert.equal(s.data.get(M.LAST_MATERIAL_KEY),raw);assert.equal(m.snapshot().entry.requested_language,'pl');assert.equal(m.clear(),true);assert.equal(s.data.has(M.LAST_MATERIAL_KEY),false);assert.equal(s.data.get('other'),'keep');
 }
});
test('removed last material ID has no return target and cannot overwrite stale record',()=>{
 const raw=JSON.stringify({version:1,material_id:'removed-material',requested_language:'ru'}),s=storage([[M.LAST_MATERIAL_KEY,raw]]),m=M.materialMemory(s);
 assert.deepEqual(m.snapshot(),{entry:null,persistence:'stale'});m.remember('site-cleaning-summary-ru','ru');assert.equal(s.data.get(M.LAST_MATERIAL_KEY),raw);assert.equal(m.snapshot().persistence,'stale');
});
test('last material denied read/write/quota/removal keeps page-only truth and task isolation',()=>{
 const taskRaw=JSON.stringify({version:1,statuses:{...M.initial(),'demo-01':'doing'}});
 for(const fail of ['get','set','remove']){
  const s=storage([[M.KEY,taskRaw]],fail),m=M.materialMemory(s);m.remember('site-cleaning-summary-ru','ru');
  if(fail!=='remove')assert.equal(m.snapshot().persistence,'blocked');
  m.clear();if(fail==='remove')assert.equal(m.snapshot().persistence,'blocked');assert.equal(s.data.get(M.KEY),taskRaw);
 }
 const s=storage(),base=s.setItem;s.setItem=()=>{throw new DOMException('quota','QuotaExceededError');};const m=M.materialMemory(s);m.remember('site-cleaning-summary-ru','ru');assert.equal(m.snapshot().persistence,'blocked');assert.equal(s.data.has(M.LAST_MATERIAL_KEY),false);s.setItem=base;
});
test('explicit last-material UI return preserves query/source/task filter and restores requested ua context',()=>{
 const h=ui({lang:'UA'});assert.equal(h.$('materialReading').hidden,true);assert.equal(h.$('lastMaterialReturn').disabled,true);
 h.change('demo-01','doing');h.change('filter','doing');h.change('materialsSource','mock');h.click('read-site-cleaning-summary-ru');
 assert.equal(h.$('materialReading').hidden,false);assert.equal(h.document.activeElement.id,'reading-title');assert.equal(JSON.parse(h.store.data.get(M.LAST_MATERIAL_KEY)).requested_language,'ua');
 const href=h.location.href,raw=h.store.data.get(M.KEY),reload=ui({href,store:h.store});assert.equal(reload.$('materialReading').hidden,true);assert.equal(reload.$('lastMaterialReturn').disabled,false);
 reload.change('language','pl');reload.change('materialsSource','mock');reload.$('materialQuery').value='unmatched query';reload.$('materialQuery').handlers.input();assert.equal(reload.$('materials').children.length,0);
 const search=reload.location.search,path=reload.location.pathname;reload.click('lastMaterialReturn');
 assert.equal(reload.$('materialQuery').value,'unmatched query');assert.equal(reload.$('materialsSource').value,'mock');assert.equal(reload.$('filter').value,'doing');assert.equal(reload.document.documentElement.lang,'uk');assert.match(reload.location.hash+reload.location.search,/lang=uk/);assert.equal(reload.$('reading-title').lang,'ru');assert.equal(reload.document.activeElement.id,'reading-title');assert.equal(reload.store.data.get(M.KEY),raw);assert.equal(reload.location.pathname,path);
 reload.click('lastMaterialClear');assert.equal(reload.$('materialReading').hidden,true);assert.equal(reload.store.data.has(M.LAST_MATERIAL_KEY),false);assert.equal(reload.document.activeElement.id,'materialsTitle');assert.equal(reload.store.data.get(M.KEY),raw);
});
test('last-material UI corrupt/stale records show notice and clear without empty reading panel',()=>{
 for(const raw of ['{bad',JSON.stringify({version:1,material_id:'deleted',requested_language:'ru'})]){
  const h=ui({store:storage([[M.LAST_MATERIAL_KEY,raw]])});assert.equal(h.$('lastMaterialReturn').disabled,true);assert.equal(h.$('materialReading').hidden,true);assert.match(h.$('lastMaterialNotice').textContent,/damaged|no longer available/);h.click('lastMaterialClear');assert.equal(h.store.data.has(M.LAST_MATERIAL_KEY),false);
 }
});
test('last-material blocked notice never claims persistence or removal; task reset leaves material choice',()=>{
 const h=ui({store:storage([],'set')});h.click('read-site-cleaning-summary-ru');assert.match(h.$('lastMaterialNotice').textContent,/only on this page/);
 const s=storage(),good=ui({store:s});good.click('read-site-cleaning-summary-ru');const raw=s.data.get(M.LAST_MATERIAL_KEY);good.click('reset');good.click('confirm');assert.equal(s.data.get(M.LAST_MATERIAL_KEY),raw);
});

test('favourites pin is explicit, exact and idempotent without language overwrite or recent import',()=>{
 const last=JSON.stringify({version:1,material_id:'site-cleaning-summary-ru',requested_language:'pl'}),s=storage([[M.LAST_MATERIAL_KEY,last]]),f=M.materialFavourites(s);
 assert.deepEqual(f.snapshot().items,[]);assert.deepEqual(s.calls,[['get',M.FAVOURITES_KEY]]);
 assert.equal(f.pin('site-cleaning-summary-ru','ua'),true);const raw=s.data.get(M.FAVOURITES_KEY),calls=s.calls.length;
 assert.deepEqual(JSON.parse(raw),{version:1,items:[{material_id:'site-cleaning-summary-ru',requested_language:'ua'}]});assert.ok(new TextEncoder().encode(raw).length<=2048);
 assert.equal(f.pin('site-cleaning-summary-ru','pl'),true);assert.deepEqual(s.calls.slice(calls),[['get',M.FAVOURITES_KEY]]);assert.equal(s.data.get(M.FAVOURITES_KEY),raw);assert.equal(s.data.get(M.LAST_MATERIAL_KEY),last);
 assert.equal(M.materialFavourites(s).snapshot().items[0].requested_language,'ua');assert.equal(Object.isFrozen(f.snapshot().items[0]),true);assert.throws(()=>f.snapshot().items.push({}),TypeError);
 let coerced=false;assert.equal(f.pin({toString(){coerced=true;return 'site-cleaning-summary-ru';}},'ru'),false);assert.equal(coerced,false);assert.equal(f.pin('https://private.example/','ru'),false);assert.equal(f.pin('site-cleaning-summary-ru','RU'),false);
});
test('favourites strict parser rejects malformed/version/extra/duplicate/cap records without adopting or overwriting',()=>{
 const item={material_id:'site-cleaning-summary-ru',requested_language:'ru'};
 const records=['{bad','null','[]',JSON.stringify({version:2,items:[item]}),JSON.stringify({version:'1',items:[]}),JSON.stringify({version:1,items:null}),JSON.stringify({version:1,items:[null]}),JSON.stringify({version:1,items:[item,item]}),JSON.stringify({version:1,items:Array(6).fill(item)}),JSON.stringify({version:1,items:[{...item,title:'not allowed'}]}),JSON.stringify({version:1,items:[{...item,requested_language:'unknown'}]}),JSON.stringify({version:1,items:[],query:'private'}),' '.repeat(2049),JSON.stringify({version:1,items:[{material_id:'界'.repeat(1000),requested_language:'ru'}]})];
 for(const raw of records){const s=storage([[M.FAVOURITES_KEY,raw]]),f=M.materialFavourites(s);assert.equal(f.snapshot().persistence,'invalid');assert.equal(f.snapshot().items.length,0);f.pin(item.material_id,'pl');assert.equal(s.data.get(M.FAVOURITES_KEY),raw);assert.equal(s.calls.some(([op])=>op==='set'),false);}
 const raw=JSON.stringify({version:1,items:[item]}),s=storage([[M.FAVOURITES_KEY,raw+' '.repeat(2048-raw.length)]]);assert.equal(M.materialFavourites(s).snapshot().items.length,1);assert.equal(s.calls.length,1);
});
test('favourites removed ID is stale with no target and recovery clears only its own key',()=>{
 const stale=JSON.stringify({version:1,items:[{material_id:'removed',requested_language:'ru'}]}),s=storage([[M.FAVOURITES_KEY,stale],[M.KEY,'task bytes'],[M.LAST_MATERIAL_KEY,'last bytes'],['other','keep']]),f=M.materialFavourites(s);
 assert.deepEqual(f.snapshot(),{items:[],persistence:'stale'});f.pin('site-cleaning-summary-ru','ru');f.remove('site-cleaning-summary-ru');assert.equal(s.data.get(M.FAVOURITES_KEY),stale);assert.equal(f.clear(),true);assert.equal(s.data.has(M.FAVOURITES_KEY),false);assert.equal(s.data.get(M.KEY),'task bytes');assert.equal(s.data.get(M.LAST_MATERIAL_KEY),'last bytes');assert.equal(s.data.get('other'),'keep');
});
test('favourites denied read/write/quota/removal has honest page-only state and preserves persisted raw',()=>{
 const raw=JSON.stringify({version:1,items:[{material_id:'site-cleaning-summary-ru',requested_language:'uk'}]});
 const readDenied=storage([[M.FAVOURITES_KEY,raw]],'get'),f=M.materialFavourites(readDenied);f.pin('site-cleaning-summary-ru','pl');assert.equal(f.snapshot().persistence,'blocked');assert.equal(readDenied.data.get(M.FAVOURITES_KEY),raw);assert.equal(readDenied.calls.some(([op])=>op==='set'),false);
 for(const quota of [false,true]){const s=storage();s.setItem=()=>{throw quota?new DOMException('quota','QuotaExceededError'):new DOMException('denied','SecurityError');};const m=M.materialFavourites(s);assert.equal(m.pin('site-cleaning-summary-ru','ru'),true);assert.equal(m.snapshot().persistence,'blocked');assert.equal(m.snapshot().items.length,1);assert.equal(s.data.has(M.FAVOURITES_KEY),false);}
 const s=storage([[M.FAVOURITES_KEY,raw]],'remove'),m=M.materialFavourites(s);assert.equal(m.remove('site-cleaning-summary-ru'),true);assert.equal(m.snapshot().items.length,0);assert.equal(m.snapshot().persistence,'blocked');assert.equal(s.data.get(M.FAVOURITES_KEY),raw);assert.equal(m.clear(),false);
});
test('favourites and recent/task mutations never cross storage keys',()=>{
 const task=JSON.stringify({version:1,statuses:{...M.initial(),'demo-01':'doing'}}),last=JSON.stringify({version:1,material_id:'site-cleaning-summary-ru',requested_language:'pl'}),s=storage([[M.KEY,task],[M.LAST_MATERIAL_KEY,last]]),f=M.materialFavourites(s);
 f.pin('site-cleaning-summary-ru','uk');assert.equal(s.data.get(M.KEY),task);assert.equal(s.data.get(M.LAST_MATERIAL_KEY),last);const pinned=s.data.get(M.FAVOURITES_KEY);M.materialMemory(s).remember('site-cleaning-summary-ru','en');assert.equal(s.data.get(M.FAVOURITES_KEY),pinned);M.materialMemory(s).clear();assert.equal(s.data.get(M.FAVOURITES_KEY),pinned);M.create(s).reset(true);assert.equal(s.data.get(M.FAVOURITES_KEY),pinned);
 f.remove('site-cleaning-summary-ru');assert.equal(s.data.has(M.FAVOURITES_KEY),false);assert.equal(s.data.has(M.KEY),false);assert.equal(s.data.has(M.LAST_MATERIAL_KEY),false);
});
test('favourites explicit UI pin survives other-language Read and lastClear/reload; Open preserves context and keys',()=>{
 const h=ui({lang:'UA'});h.change('demo-01','doing');h.change('filter','doing');const task=h.store.data.get(M.KEY);h.click('pin-site-cleaning-summary-ru');const pinned=h.store.data.get(M.FAVOURITES_KEY);assert.equal(JSON.parse(pinned).items[0].requested_language,'ua');assert.equal(h.$('pin-site-cleaning-summary-ru').disabled,true);assert.equal(h.$('materialReading').hidden,true);
 h.change('language','pl');h.click('read-site-cleaning-summary-ru');assert.equal(h.store.data.get(M.FAVOURITES_KEY),pinned);h.click('lastMaterialClear');assert.equal(h.store.data.get(M.FAVOURITES_KEY),pinned);
 const reload=ui({href:h.location.href,store:h.store});assert.equal(reload.$('favouritesList').children.length,1);assert.equal(reload.$('materialReading').hidden,true);reload.change('materialsSource','mock');reload.$('materialQuery').value='no matching material';reload.$('materialQuery').handlers.input();const url=reload.location.pathname;
 reload.click('pin-open-site-cleaning-summary-ru');assert.equal(reload.$('materialQuery').value,'no matching material');assert.equal(reload.$('materialsSource').value,'mock');assert.equal(reload.$('filter').value,'doing');assert.equal(reload.$('reading-title').lang,'ru');assert.equal(reload.document.documentElement.lang,'uk');assert.equal(reload.store.data.has(M.LAST_MATERIAL_KEY),false);assert.equal(reload.store.data.get(M.KEY),task);assert.equal(reload.location.pathname,url);assert.equal(reload.store.data.get(M.FAVOURITES_KEY),pinned);
 reload.click('pin-remove-site-cleaning-summary-ru');assert.equal(reload.$('favouritesList').children.length,0);assert.equal(reload.$('materialQuery').value,'no matching material');assert.equal(reload.store.data.has(M.LAST_MATERIAL_KEY),false);assert.equal(reload.store.data.get(M.KEY),task);
});
test('pin Open/Remove preserve a non-null last record byte-for-byte and task reset does not erase pins',()=>{
 const s=storage(),h=ui({store:s});h.click('read-site-cleaning-summary-ru');h.click('pin-site-cleaning-summary-ru');const last=s.data.get(M.LAST_MATERIAL_KEY),pinned=s.data.get(M.FAVOURITES_KEY);h.click('pin-open-site-cleaning-summary-ru');assert.equal(s.data.get(M.LAST_MATERIAL_KEY),last);h.click('reset');h.click('confirm');assert.equal(s.data.get(M.FAVOURITES_KEY),pinned);h.click('pin-remove-site-cleaning-summary-ru');assert.equal(s.data.get(M.LAST_MATERIAL_KEY),last);
});
test('favourites UI corrupt/denied key offers only own recovery and never renders unknown content',()=>{
 for(const raw of ['{broken',JSON.stringify({version:1,items:[{material_id:'deleted',requested_language:'ru'}]})]){const h=ui({store:storage([[M.FAVOURITES_KEY,raw]])});assert.equal(h.$('favouritesList').children.length,0);assert.equal(h.$('materialReading').hidden,true);assert.equal(h.$('favouritesClear').hidden,false);assert.match(h.$('favouritesNotice').textContent,/damaged|unavailable material/);h.click('favouritesClear');assert.equal(h.store.data.has(M.FAVOURITES_KEY),false);}
 const s=storage(),get=s.getItem;s.getItem=k=>{if(k===M.FAVOURITES_KEY)throw new DOMException('denied','SecurityError');return get(k);};const h=ui({store:s});h.click('pin-site-cleaning-summary-ru');assert.match(h.$('favouritesNotice').textContent,/only on this page/);assert.equal(h.$('favouritesList').children.length,1);assert.equal(s.data.has(M.FAVOURITES_KEY),false);
});
test('favourites sequential stale instances preserve persisted language and observe removal',()=>{
 const s=storage(),a=M.materialFavourites(s),b=M.materialFavourites(s),id='site-cleaning-summary-ru';
 a.pin(id,'ua');const raw=s.data.get(M.FAVOURITES_KEY);b.pin(id,'pl');assert.equal(s.data.get(M.FAVOURITES_KEY),raw);assert.equal(b.snapshot().items[0].requested_language,'ua');
 a.remove(id);b.pin(id,'pl');assert.equal(JSON.parse(s.data.get(M.FAVOURITES_KEY)).items[0].requested_language,'pl');a.remove(id);assert.equal(s.data.has(M.FAVOURITES_KEY),false);
});
test('favourites mutations preserve newly invalid backing records until explicit clear',()=>{
 const id='site-cleaning-summary-ru';
 for(const raw of ['{broken',JSON.stringify({version:2,items:[]}),JSON.stringify({version:1,items:[{material_id:'unknown',requested_language:'ua'}]}),' '.repeat(2049)]){
  for(const op of ['pin','remove']){const s=storage(),f=M.materialFavourites(s);f.pin(id,'ua');s.data.set(M.FAVOURITES_KEY,raw);f[op](id,'pl');assert.equal(s.data.get(M.FAVOURITES_KEY),raw);assert.match(f.snapshot().persistence,/invalid|stale/);assert.equal(f.clear(),true);assert.equal(s.data.has(M.FAVOURITES_KEY),false);}
 }
});

test('favourites mutation read failure after initialization never writes over backing state',()=>{
 const id='site-cleaning-summary-ru',s=storage(),f=M.materialFavourites(s);f.pin(id,'ua');const raw=s.data.get(M.FAVOURITES_KEY);s.getItem=()=>{throw new Error('denied');};
 f.remove(id);assert.equal(f.snapshot().persistence,'blocked');assert.equal(s.data.get(M.FAVOURITES_KEY),raw);f.pin(id,'pl');assert.equal(f.snapshot().persistence,'blocked');assert.equal(s.data.get(M.FAVOURITES_KEY),raw);
});
