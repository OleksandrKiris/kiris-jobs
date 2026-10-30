import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('apply/app.js','utf8');
const seam=source.replace(/\n  render\(\);\n\}\)\(\);\s*$/,'\n  window.searchTest = { languageList, setAll(value) { showAllLanguages = value; } };\n})();');assert.notEqual(seam,source);
function fixture(){
 const window={location:new URL('https://example.test/apply/'),addEventListener(){}};
 const context=vm.createContext({window,URL,Intl,Date,console,navigator:{},localStorage:{getItem(){return null;}},document:{getElementById(id){return id==='app'?{}:null;}},fetch(){throw Error('No network in search regression fixture');}});
 for(const file of ['config','i18n-core','i18n-caucasus-central','i18n-asia','i18n-extra','i18n-mobile','translations'])vm.runInContext(readFileSync('apply/'+file+'.js','utf8'),context);
 vm.runInContext(seam,context);return {...window.searchTest,languages:window.CITRONEX_SIMPLE_I18N.languages,priority:window.CITRONEX_SIMPLE_I18N.priority};
}
test('all20 displayed native names match equivalent NFC/NFD representations, case and surrounding spaces',()=>{
 const {languageList,languages}=fixture();let cases=0;
 for(const [code,meta] of Object.entries(languages))for(const query of [meta.native,meta.native.normalize('NFD'),meta.native.toUpperCase().normalize('NFD'),'  '+meta.native.normalize('NFD')+'  ',meta.english.toUpperCase()]){
  assert(languageList(query).some(([c])=>c===code),JSON.stringify({code,query}));cases++;
 }
 assert.equal(cases,100);
});
test('the five observed equivalent queries retain their actual letters and marks',()=>{
 const {languageList}=fixture();
 for(const [code,query] of Object.entries({uk:'Украі\u0308нська',ru:'Русскии\u0306',tr:'Tu\u0308rkc\u0327e',tg:'Тоҷики\u0304',vi:'Tie\u0302\u0301ng Vie\u0323\u0302t'}))assert.deepEqual(Array.from(languageList(query),([c])=>c),[code]);
 for(const query of ['Turkce','Tieng Viet','Украінська'])assert.equal(languageList(query).length,0,'Canonical equivalence does not remove meaningful marks');
});
test('empty and expanded priority order, unmatched input and recovery remain unchanged',()=>{
 const {languageList,setAll,priority}=fixture();const initial=Array.from(languageList(),([c])=>c);assert.deepEqual(initial,Array.from(priority));assert.equal(initial.length,9);
 assert.equal(languageList('no-such-language-<script>').length,0);assert.deepEqual(Array.from(languageList('  '),([c])=>c),initial);
 setAll(true);const all=Array.from(languageList(),([c])=>c);assert.equal(all.length,20);assert.deepEqual(all.slice(0,priority.length),Array.from(priority));
 setAll(false);assert.deepEqual(Array.from(languageList(),([c])=>c),initial);assert(languageList('ne').some(([c])=>c==='ne'));
});
