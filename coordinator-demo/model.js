(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CoordinatorDemo = api;
})(typeof window === 'object' ? window : this, function () {
  'use strict';
  const KEY = 'primserv:coordinator-demo:v1';
  const IDS = Object.freeze(['demo-01', 'demo-02', 'demo-03']);
  const STATUSES = Object.freeze(['todo', 'doing', 'done']);
  const LANGS = Object.freeze(['ru', 'uk', 'pl', 'en']);
  const initial = () => Object.fromEntries(IDS.map(id => [id, 'todo']));
  function language(value) {
    const code = String(value || 'en').toLowerCase();
    return code === 'ua' ? 'uk' : LANGS.includes(code) ? code : 'en';
  }
  function decode(raw) {
    if (raw === null) return initial();
    if (typeof raw !== 'string' || raw.length > 2000) throw Error('invalid');
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || Object.keys(value).sort().join(',') !== 'statuses,version') throw Error('invalid');
    const statuses = value.statuses;
    if (!statuses || typeof statuses !== 'object' || Array.isArray(statuses) ||
        Object.keys(statuses).sort().join(',') !== IDS.join(',') ||
        IDS.some(id => !STATUSES.includes(statuses[id]))) throw Error('invalid');
    return Object.fromEntries(IDS.map(id => [id, statuses[id]]));
  }
  function create(storage) {
    let statuses = initial();
    let persistence = 'ready';
    let canWrite = true;
    try { statuses = decode(storage.getItem(KEY)); }
    catch (error) {
      persistence = error?.message === 'invalid' || error instanceof SyntaxError ? 'invalid' : 'blocked';
      canWrite = false;
    }
    function save() {
      // Never overwrite an unknown or damaged format, even after an edit.
      if (!canWrite) return;
      try { storage.setItem(KEY, JSON.stringify({version:1, statuses})); persistence = 'saved'; }
      catch { persistence = 'blocked'; }
    }
    return {
      snapshot: () => ({statuses:{...statuses}, persistence}),
      list(filter = 'all') { return IDS.filter(id => filter === 'all' || statuses[id] === filter); },
      set(id, status) {
        if (!IDS.includes(id) || !STATUSES.includes(status)) return false;
        statuses = {...statuses, [id]:status}; save(); return true;
      },
      reset(confirmed) {
        if (confirmed !== true) return false;
        try { storage.removeItem(KEY); persistence = 'ready'; canWrite = true; }
        catch { persistence = persistence === 'invalid' ? 'invalid' : 'blocked'; }
        statuses = initial(); return true;
      }
    };
  }
  const CONTENT_VERSION = 'fc672d805fb884eb1d09bdc8ca342ba530ad83f4';
  const material = {
    id:'site-cleaning-summary-ru', type:'job-summary', job_id:'site-cleaning',
    location_id:'zgorzelec', language:'ru', title:'Уборка территории',
    text:'Уборка территории предприятия, сбор отходов и простые хозяйственные работы внутри технических зон и на улице.',
    source:{repo:'OleksandrKiris/kiris-jobs',path:'data/content.js',ref:CONTENT_VERSION,
      selector:'jobs[id=site-cleaning]',source_updated_on:'2026-07-23',
      verified_on:'2026-10-17',verification_status:'verified-against-repository'},
    synthetic:false
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  function materialRequest(request={}) {
    if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!['location_id','language','limit','cursor'].includes(k)))throw Error('invalid_request');
    const {location_id='zgorzelec',language='en',limit=20,cursor=null}=request;
    if (location_id !== 'zgorzelec' ||
        !['ru','ua','uk','pl','en','ka','tr','hy'].includes(language) ||
        !Number.isInteger(limit) || limit < 1 || limit > 20 || cursor !== null) throw Error('invalid_request');
    return {location_id,language,limit,cursor};
  }
  function materialSnapshot(request={}) {
    const q=materialRequest(request), canonical=q.language==='ua'?'uk':q.language;
    return {api_version:'v1',schema_version:'1.0.0',content_version:CONTENT_VERSION,
      requested_language:q.language,effective_language:'ru',fallback:canonical!=='ru',
      items:[clone(material)],next_cursor:null};
  }
  // Deliberately synchronous and local: mock is a JSON transport, never a URL.
  // Both sources must return this exact pinned, reviewed slice; no online mode.
  function materialReader({mode='snapshot',mock}={}) {
    if (!['snapshot','mock'].includes(mode) || (mode==='mock' && typeof mock!=='function')) throw Error('online_disabled');
    return Object.freeze({read(request={}) {
      const q=materialRequest(request), expected=materialSnapshot(q);
      if(mode==='snapshot') return expected;
      const raw=mock(clone(q));
      if(typeof raw!=='string'||raw.length>32768||new TextEncoder().encode(raw).length>32768) throw Error('invalid_response');
      let response;
      try {response=JSON.parse(raw);} catch {throw Error('invalid_response');}
      // v1 additive fields and JSON property order remain compatible.
      const equal=(a,b)=>{
        if(a===b)return true;
        if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
        if(Array.isArray(a)&&a.length!==b.length)return false;
        return Object.keys(b).every(k=>Object.hasOwn(a,k)&&equal(a[k],b[k]));
      };
      if(!equal(response,expected))throw Error('invalid_response');
      return clone(response);
    }});
  }
  function searchMaterials(response,query='') {
    if(typeof query!=='string'||query.length>120)throw Error('invalid_query');
    const words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return response.items.filter(item=>words.every(word=>(item.title+' '+item.text+' '+item.location_id).toLocaleLowerCase().includes(word)));
  }
  const LAST_MATERIAL_KEY='primserv:coordinator:last-material:v1';
  const MATERIAL_LANGS=Object.freeze(['ru','ua','uk','pl','en','ka','tr','hy']);
  function materialMemory(storage) {
    let entry=null,persistence='ready',canWrite=true;
    const valid=value=>value&&typeof value==='object'&&!Array.isArray(value)&&
      Object.keys(value).sort().join(',')==='material_id,requested_language,version'&&
      value.version===1&&typeof value.material_id==='string'&&MATERIAL_LANGS.includes(value.requested_language);
    try {
      const raw=storage.getItem(LAST_MATERIAL_KEY);
      if(raw!==null) {
        if(typeof raw!=='string'||raw.length>256)throw Error('invalid');
        const value=JSON.parse(raw);if(!valid(value))throw Error('invalid');
        if(value.material_id!==material.id){persistence='stale';canWrite=false;}
        else entry={...value};
      }
    } catch(error){persistence=error.message==='invalid'||error instanceof SyntaxError?'invalid':'blocked';canWrite=false;}
    return Object.freeze({
      snapshot(){return {entry:entry?{...entry}:null,persistence};},
      remember(id,requestedLanguage) {
        if(id!==material.id||!MATERIAL_LANGS.includes(requestedLanguage))return false;
        entry={version:1,material_id:id,requested_language:requestedLanguage};
        if(canWrite)try {storage.setItem(LAST_MATERIAL_KEY,JSON.stringify(entry));persistence='saved';}
        catch {persistence='blocked';canWrite=false;}
        return true;
      },
      clear() {
        entry=null;
        try {storage.removeItem(LAST_MATERIAL_KEY);persistence='cleared';canWrite=true;return true;}
        catch {persistence='blocked';canWrite=false;return false;}
      }
    });
  }
  const FAVOURITES_KEY='primserv:coordinator:favourites:v1';
  function materialFavourites(storage) {
    let items=[],persistence='ready',canWrite=true;
    const keys=(value,expected)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===expected;
    try {
      const raw=storage.getItem(FAVOURITES_KEY);
      if(raw!==null) {
        if(typeof raw!=='string'||new TextEncoder().encode(raw).length>2048)throw Error('invalid');
        const record=JSON.parse(raw);
        if(!keys(record,'items,version')||record.version!==1||!Array.isArray(record.items)||record.items.length>5||
          !record.items.every(x=>keys(x,'material_id,requested_language')&&typeof x.material_id==='string'&&x.material_id.length<=100&&MATERIAL_LANGS.includes(x.requested_language))||
          new Set(record.items.map(x=>x.material_id)).size!==record.items.length)throw Error('invalid');
        if(record.items.some(x=>x.material_id!==material.id))throw Error('stale');
        items=record.items.map(x=>({...x}));
      }
    } catch(error){persistence=['invalid','stale'].includes(error.message)?error.message:error instanceof SyntaxError?'invalid':'blocked';canWrite=false;}
    function save() {
      if(!canWrite)return;
      try {
        if(!items.length)storage.removeItem(FAVOURITES_KEY);
        else {
          const raw=JSON.stringify({version:1,items});
          if(new TextEncoder().encode(raw).length>2048)throw Error('too_large');
          storage.setItem(FAVOURITES_KEY,raw);
        }
        persistence='saved';
      } catch {persistence='blocked';canWrite=false;}
    }
    return Object.freeze({
      snapshot(){return Object.freeze({items:Object.freeze(items.map(x=>Object.freeze({...x}))),persistence});},
      pin(id,requestedLanguage) {
        if(id!==material.id||!MATERIAL_LANGS.includes(requestedLanguage))return false;
        if(items.some(x=>x.material_id===id))return true;
        if(items.length>=5)return false;
        items=[...items,{material_id:id,requested_language:requestedLanguage}];save();return true;
      },
      remove(id) {
        if(id!==material.id||!items.some(x=>x.material_id===id))return false;
        items=items.filter(x=>x.material_id!==id);save();return true;
      },
      clear() {
        items=[];
        try {storage.removeItem(FAVOURITES_KEY);canWrite=true;persistence='cleared';return true;}
        catch {persistence='blocked';canWrite=false;return false;}
      }
    });
  }
  return Object.freeze({KEY, IDS, STATUSES, LANGS, initial, language, decode, create,
    CONTENT_VERSION, materialSnapshot, materialReader, searchMaterials, LAST_MATERIAL_KEY, materialMemory, FAVOURITES_KEY, materialFavourites});
});
