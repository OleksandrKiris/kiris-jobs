import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const key='citronex_screening_application_v17',source=readFileSync('apply/app.js','utf8');
const seam=source.replace(/\n  render\(\);\n\}\)\(\);\s*$/,'\n  window.draftTest={edit(value){state.data.firstName=value;saveDraft();},clearDraft,getState(){return state;},getStatus(){return draftSaveState;}};\n})();');assert.notEqual(seam,source);
function store(){return {values:new Map(),fault:'',writes:0,now:Date.now()};}
function tab(s){
 const events={},warnings=[],status={textContent:'',dataset:{}},window={location:new URL('https://example.test/apply/?lang=en'),addEventListener(k,fn){events[k]=fn;}};
 class Clock extends Date{static now(){return s.now++;}}
 const storage={getItem(k){if(s.fault==='read')throw Error('Fixture read denied');return s.values.get(k)??null;},setItem(k,v){if(s.fault==='quota')throw Error('Fixture quota denied');s.values.set(k,v);s.writes++;},removeItem(k){s.values.delete(k);}};
 const context=vm.createContext({window,URL,Intl,Date:Clock,console:{warn(...a){warnings.push(a[0]);}},navigator:{},localStorage:storage,document:{getElementById(id){return id==='app'?{}:id==='draftStatus'?status:null;}},fetch(){throw Error('No unit network');}});
 for(const file of ['config','i18n-core','i18n-caucasus-central','i18n-asia','i18n-extra','i18n-mobile','translations'])vm.runInContext(readFileSync('apply/'+file+'.js','utf8'),context);
 vm.runInContext(seam,context);return {...window.draftTest,hide:events.pagehide,warnings,raw:()=>s.values.get(key)??null};
}
test('passive older-tab pagehide preserves the exact newer record and both live answers',()=>{
 const s=store(),a=tab(s);a.edit('OLDER');const b=tab(s);b.edit('LATEST');const latest=b.raw(),writes=s.writes;a.hide();assert.equal(b.raw(),latest);assert.equal(s.writes,writes);assert.equal(a.getState().data.firstName,'OLDER');assert.equal(b.getState().data.firstName,'LATEST');
});
test('passive older-tab pagehide never resurrects a draft explicitly removed elsewhere',()=>{
 const s=store(),a=tab(s);a.edit('OLDER');const b=tab(s);assert(b.clearDraft());const writes=s.writes;a.hide();assert.equal(a.raw(),null);assert.equal(s.writes,writes);assert.equal(a.getState().data.firstName,'OLDER');
});
test('replacement, timestamp-only update and malformed foreign bytes are all preserved exactly',()=>{
 for(const changed of [old=>JSON.stringify({...JSON.parse(old),id:'OTHER-FIXTURE'}),old=>JSON.stringify({...JSON.parse(old),savedAt:JSON.parse(old).savedAt+1}),()=>'{foreign malformed fixture}']){
  const s=store(),a=tab(s);a.edit('OLDER');const raw=changed(a.raw());s.values.set(key,raw);const writes=s.writes;a.hide();assert.equal(a.raw(),raw);assert.equal(s.writes,writes);
 }
});
test('ordinary unchanged pagehide retains the previous save and TTL refresh behavior',()=>{
 const s=store(),a=tab(s);a.edit('CURRENT');const before=JSON.parse(a.raw());a.hide();const after=JSON.parse(a.raw());assert.deepEqual(after.data,before.data);assert.equal(after.id,before.id);assert(after.savedAt>before.savedAt);assert.equal(a.getStatus(),'saved');a.hide();assert(JSON.parse(a.raw()).savedAt>after.savedAt);
});
test('quota failure retries on pagehide only while the last saved record still matches',()=>{
 const s=store(),a=tab(s);a.edit('OLD');s.fault='quota';a.edit('CURRENT');assert.equal(a.getStatus(),'failed');s.fault='';a.hide();assert.equal(JSON.parse(a.raw()).data.firstName,'CURRENT');assert.equal(a.getStatus(),'saved');
 const b=tab(s);b.edit('LATEST');s.fault='quota';a.edit('UNSAVED');s.fault='';const latest=b.raw();a.hide();assert.equal(a.raw(),latest);assert.equal(a.getState().data.firstName,'UNSAVED');assert.equal(a.getStatus(),'failed');
});
test('read denial retains the last record and reports the existing failure state',()=>{
 const s=store(),a=tab(s);a.edit('CURRENT');const saved=a.raw();s.fault='read';a.hide();assert.equal(a.raw(),saved);assert.equal(a.getStatus(),'failed');assert(a.warnings.includes('Draft save failed.'));s.fault='';a.hide();assert.equal(JSON.parse(a.raw()).data.firstName,'CURRENT');assert.equal(a.getStatus(),'saved');
});
test('explicit later input remains the latest intentional write and pagehide can follow it',()=>{
 const s=store(),a=tab(s);a.edit('OLDER');const b=tab(s);b.edit('LATEST');a.edit('EXPLICIT_LATER_INPUT');const explicit=JSON.parse(a.raw());assert.equal(explicit.data.firstName,'EXPLICIT_LATER_INPUT');a.hide();assert.deepEqual(JSON.parse(a.raw()).data,explicit.data);assert.equal(b.getState().data.firstName,'LATEST');
});
test('empty startup, failed initial save and successful clear do not create passive ghost drafts',()=>{
 const s=store(),a=tab(s);a.hide();assert.equal(a.raw(),null);s.fault='quota';a.edit('CURRENT');s.fault='';a.hide();assert.equal(JSON.parse(a.raw()).data.firstName,'CURRENT');assert(a.clearDraft());const writes=s.writes;a.hide();assert.equal(a.raw(),null);assert.equal(s.writes,writes);assert.equal(a.getStatus(),'idle');
});
