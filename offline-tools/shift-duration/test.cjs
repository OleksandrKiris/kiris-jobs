const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const C = require('./core.js');
const { spawnSync } = require('node:child_process');
const good = () => ({start:'06:00',end:'14:00',nextDay:false,breakMinutes:'30',lang:'en'});
function storage(initial) {
  const map = new Map(initial ? [[C.KEY, initial],['other','keep']] : [['other','keep']]);
  return {map, getItem:k=>map.get(k)??null, setItem:(k,v)=>map.set(k,v), removeItem:k=>map.delete(k)};
}
test('day and overnight arithmetic, no implicit midnight assumption', () => {
  assert.deepEqual(C.calculate(good()),{total:480,rest:30,net:450});
  assert.deepEqual(C.calculate({...good(),start:'22:00',end:'06:00',nextDay:true}),{total:480,rest:30,net:450});
  assert.equal(C.calculate({...good(),start:'22:00',end:'06:00'}).error,'rangeError');
});
test('zero / 24 hours / >24 hours are rejected, one minute allowed', () => {
  for(const nextDay of [true,false]) assert.equal(C.calculate({...good(),end:'06:00',nextDay}).error,'rangeError');
  assert.equal(C.calculate({...good(),nextDay:true}).error,'rangeError');
  assert.equal(C.calculate({...good(),end:'06:01',breakMinutes:'0'}).net,1);
});
test('empty and malformed times and breaks', () => {
  for(const start of ['', '24:00','6:00','12:60',null,'<script>']) assert.equal(C.calculate({...good(),start}).error,'timeError');
  for(const breakMinutes of ['', '-1','1.5','1e2','480','10000',null]) assert.equal(C.calculate({...good(),breakMinutes}).error,'breakError');
  assert.equal(C.calculate({...good(),breakMinutes:'0'}).net,480);
  assert.equal(C.calculate({...good(),nextDay:'true'}).error,'rangeError');
});
test('all supported languages and honest fallback', () => {
  for(const lang of C.LANGS) assert.equal(C.language(lang),lang);
  assert.equal(C.language('ua'),'uk');
  for(const lang of ['xx','',null]) assert.equal(C.language(lang),'en');
});
test('empty storage, save and reload preserve only allowed fields', () => {
  const s=storage(); assert.equal(C.read(()=>s).status,'empty');
  assert.equal(C.save(()=>s,good()),'saved'); assert.deepEqual(C.read(()=>s).value,good());
  assert.equal(C.save(()=>s,{...good(),name:'no'}),'saveFailed');
  assert.equal(s.map.get('other'),'keep');
});
test('corrupt, future and incompatible formats are never overwritten', () => {
  for(const raw of ['{','null','[]',JSON.stringify({version:2,value:good()}),JSON.stringify({version:1,value:{...good(),lang:'xx'}})]) {
    const s=storage(raw); assert.equal(C.read(()=>s).status,'unsupported');
    assert.equal(C.save(()=>s,good()),'unsupported'); assert.equal(s.getItem(C.KEY),raw);
  }
});
test('denied read never overwrites an unseen record even when writes work; recovery is explicit', () => {
  const raw=JSON.stringify({version:1,value:{...good(),start:'07:00'}}), s=storage(raw);
  let blocked=true, writes=0;
  const access={getItem(key){if(blocked)throw Error('read denied');return s.getItem(key);},
    setItem(key,value){writes++;s.setItem(key,value);}};
  assert.equal(C.save(()=>access,good()),'saveFailed');
  assert.equal(writes,0);assert.equal(s.getItem(C.KEY),raw);assert.equal(s.getItem('other'),'keep');
  assert.equal(C.calculate(good()).net,450);
  blocked=false;assert.equal(C.save(()=>access,good()),'saved');
  assert.equal(writes,1);assert.deepEqual(C.read(()=>s).value,good());
});
test('denied storage, quota and cancelled/confirmed forget', () => {
  const denied=()=>{throw Error('denied');};
  assert.equal(C.read(denied).status,'unavailable'); assert.equal(C.save(denied,good()),'saveFailed'); assert.equal(C.forget(denied,true),'saveFailed');
  const s=storage('old'); assert.equal(C.forget(()=>s,false),'cancelled'); assert.equal(s.getItem(C.KEY),'old');
  assert.equal(C.forget(()=>s,true),'forgotten'); assert.equal(s.getItem(C.KEY),null); assert.equal(s.getItem('other'),'keep');
  assert.equal(C.save(()=>({getItem:()=>null,setItem:()=>{throw Error('quota');}}),good()),'saveFailed');
});
function ui(lang='en', persisted=null, denied=false) {
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const els=new Map();
  function element(id) { return {id,value:'',checked:false,textContent:'',hidden:false,attrs:{},children:[],events:{},dataset:{},addEventListener(k,f){this.events[k]=f;},removeAttribute(k){delete this.attrs[k];},setAttribute(k,v){this.attrs[k]=v;},focus(){this.focused=true;},replaceChildren(){this.children=[];this.textContent='';},append(e){this.children.push(e);}}; }
  for(const [,id] of html.matchAll(/id="([^"]+)"/g)) els.set(id,element(id));
  const labels=Array.from(html.matchAll(/data-i18n="([^"]+)"/g),m=>({...element(''),dataset:{i18n:m[1]}}));
  const s=storage(persisted);
  const window={ShiftDuration:C,location:{search:`?lang=${lang}`,href:`http://localhost/?lang=${lang}`},confirm:()=>false,history:{replaceState(_state,_title,url){window.location.href=String(url);window.location.search=url.search;}}};
  Object.defineProperty(window,'localStorage',{get(){if(denied)throw Error('denied');return s;}});
  const document={documentElement:{},getElementById:id=>els.get(id),querySelectorAll:()=>labels,createElement:()=>element('')};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'locales.js'),'utf8'),{window});
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),{window,document,URLSearchParams,URL});
  return {els,labels,window,document,s,set(v){for(const [k,x] of Object.entries(v))if(els.has(k))els.get(k)[k==='nextDay'?'checked':'value']=x;},event(id,type){els.get(id).events[type]({preventDefault(){}});}};
}
test('actual controller: calculate, errors clear stale output, change language retains inputs', () => {
  const u=ui();u.set(good());u.event('calculator','submit');assert.match(u.els.get('result').textContent,/7 h 30 min/);
  u.set({language:'uk'});u.event('language','change');assert.equal(u.document.documentElement.lang,'uk');assert.equal(u.els.get('start').value,'06:00');assert.match(u.els.get('result').textContent,/7 год 30 хв/);
  assert.match(u.els.get('jobs').href,/lang=uk/);assert.match(u.els.get('hydra').href,/lang=ua/);
  assert.match(u.window.location.search,/lang=uk/);
  u.set({end:''});u.event('calculator','input');assert.equal(u.els.get('end').attrs['aria-invalid'],'true');assert.doesNotMatch(u.els.get('result').textContent,/7 год/);
});
test('blocked history never prevents language changes or calculation', () => {
  const u=ui(); u.window.history.replaceState=()=>{throw Error('blocked');};
  u.set({...good(),language:'pl'});u.event('language','change');u.event('calculator','submit');
  assert.equal(u.document.documentElement.lang,'pl');assert.match(u.els.get('result').textContent,/7 godz. 30 min/);
});
test('actual controller: manual save, reload, cancel and confirmed forget preserve live fields', () => {
  const u=ui();u.set(good());u.event('calculator','submit');assert.equal(u.s.getItem(C.KEY),null);
  u.event('save','click');const v=ui('en',u.s.getItem(C.KEY));assert.equal(v.els.get('start').value,'06:00');assert.match(v.els.get('result').textContent,/7 h 30 min/);
  v.event('forget','click');assert.notEqual(v.s.getItem(C.KEY),null);
  v.window.confirm=()=>true;v.event('forget','click');assert.equal(v.s.getItem(C.KEY),null);assert.equal(v.els.get('start').value,'06:00');assert.equal(v.s.getItem('other'),'keep');
});
test('Save button reports read denial without overwriting or losing the current calculation', () => {
  const raw=JSON.stringify({version:1,value:good()}),u=ui('en',raw);
  u.s.getItem=()=>{throw Error('read denied');};
  u.set({start:'07:00'});u.event('save','click');
  assert.equal(u.s.map.get(C.KEY),raw);assert.equal(u.s.map.get('other'),'keep');
  assert.match(u.els.get('storageStatus').textContent,/Could not save/);
  assert.match(u.els.get('result').textContent,/6 h 30 min/);
  assert.equal(u.els.get('start').value,'07:00');
});
test('all UI labels exist, fallback, denied storage still calculates', () => {
  for(const lang of C.LANGS) {const u=ui(lang);assert.equal(u.document.documentElement.lang,lang);assert(u.labels.every(e=>typeof e.textContent==='string'&&e.textContent.length));}
  const u=ui('xx',null,true);assert.equal(u.els.get('fallback').hidden,false);assert.equal(u.document.documentElement.lang,'en');u.set(good());u.event('calculator','submit');assert.match(u.els.get('result').textContent,/7 h 30 min/);
});
test('packaged dependencies are local, no network API or service worker, original logo', () => {
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {if(/^https:/.test(ref))continue;assert(fs.existsSync(path.join(__dirname,ref.split('?')[0])));}
  for(const file of ['core.js','locales.js','app.js']) assert.doesNotMatch(fs.readFileSync(path.join(__dirname,file),'utf8'),/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|serviceWorker|setInterval|innerHTML/);
  assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);assert.match(html,/aria-live="polite"/);
  assert.deepEqual(fs.readFileSync(path.join(__dirname,'primserv-logo.svg')),fs.readFileSync(path.join(__dirname,'../../assets/primserv-logo.svg')));
});
test('advertised languages match the connected language picker', () => {
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const picker=html.match(/<select id="language">([\s\S]*?)<\/select>/)[1];
  const choices=Array.from(picker.matchAll(/value="([^"]+)"/g), m=>m[1]);
  assert.deepEqual([...C.LANGS].sort(),choices.sort());
});
test('ka/tr/hy render their dictionaries without overwriting saved fields', () => {
  for(const lang of ['ka','tr','hy']) {
    assert.equal(C.language(lang),lang);
    const raw=JSON.stringify({version:1,value:good()});
    for(const denied of [false,true]) {
      const u=ui(lang,raw,denied);
      assert.equal(u.document.documentElement.lang,lang);
      assert.equal(u.els.get('fallback').hidden,true);
      assert.ok(u.labels.every(e=>typeof e.textContent==='string'&&e.textContent.length));
      u.set(good());u.event('calculator','submit');
      assert.equal(u.els.get('result').textContent, {ka:'7 სთ 30 წთ',tr:'7 sa 30 dk',hy:'7 ժ 30 ր'}[lang]);
      assert.equal(u.els.get('externalNotice').hidden,false);
      assert.equal(u.document.title,u.window.ShiftDurationLocales[lang].title+' · PrimServ');
      assert.equal(u.s.getItem(C.KEY),raw);
      assert.equal(u.s.getItem('other'),'keep');
    }
  }
});
test('browser entry refuses execution outside CI before loading a browser or accessing git', () => {
  const run = spawnSync(process.execPath, [path.join(__dirname, 'browser-acceptance.mjs')], {
    env: { ...process.env, GITHUB_ACTIONS: 'false', PLAYWRIGHT_PACKAGE: '/nonexistent/playwright', TESTED_HEAD: '', TESTED_BASE: '' },
    encoding: 'utf8', timeout: 10000
  });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /CI-only browser entry/);
  assert.doesNotMatch(run.stderr, /Cannot find module|not a git repository/);
});
test('narrow native time controls have stacked layout and a versioned stylesheet', () => {
  const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const browser = fs.readFileSync(path.join(__dirname, 'browser-acceptance.mjs'), 'utf8');
  assert.match(css, /@media\(max-width:400px\)\{\.times\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(html, /style\.css\?v=2/);
  assert.match(browser, /Time editors must remain inside their card/);
});
test('prepared CI entry records exact version, offline scenarios and closes resources', () => {
  const source = fs.readFileSync(path.join(__dirname, 'browser-acceptance.mjs'), 'utf8');
  for (const field of ['PLAYWRIGHT_PACKAGE', 'TESTED_HEAD', 'TESTED_BASE', 'BROWSER_REPORT', 'acceptance.json']) assert(source.includes(field));
  assert.match(source, /offline: true/);
  assert.match(source, /navigator\.onLine/);
  assert.match(source, /createHash\('sha256'\)/);
  assert.match(source, /Exact-head mismatch/);
  assert.match(source, /No external requests, even failed attempts/);
  assert.match(source, /await context\.close\(\)/);
  assert.match(source, /await browser\.close\(\)/);
  for (const scenario of ['previous-v1', 'corrupt', 'future', 'read-denied', 'write-denied', 'remove-denied']) assert(source.includes(scenario));
  assert.doesNotMatch(source, /--no-sandbox|createServer|\.install\(/);
});



test('real browser fixture never reseeds recovered data after a new document', () => {
  const {installFixture}=require('./browser-fixtures.cjs');
  for(const denied of [undefined,'getItem','setItem','removeItem']) {
    const map=new Map();
    const install=()=>{
      class Storage {getItem(k){return map.get(k)??null;}setItem(k,v){map.set(k,String(v));}removeItem(k){map.delete(k);}}
      const localStorage=new Storage(),window={};
      vm.runInNewContext('('+installFixture.toString()+')(args)',{Storage,localStorage,window,DOMException,args:{key:C.KEY,other:'test-other',raw:'{broken',denied}});
      return {localStorage,window};
    };
    const first=install();
    assert.equal(first.window.__shiftFixture.read(C.KEY),'{broken');
    first.window.__shiftFixture.restore();
    const recovered=JSON.stringify({version:1,value:good()});
    first.localStorage.setItem(C.KEY,recovered);
    const reloaded=install(); // Fresh JS document, same persisted storage; no sessionStorage dependency.
    assert.equal(reloaded.localStorage.getItem(C.KEY),recovered);
    reloaded.localStorage.setItem(C.KEY,recovered);
    assert.equal(reloaded.localStorage.getItem('test-other'),'keep');
    reloaded.localStorage.removeItem(C.KEY);
    const afterReset=install();
    assert.equal(afterReset.localStorage.getItem(C.KEY),null);
  }
});
