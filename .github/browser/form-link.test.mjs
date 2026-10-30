import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync('apply/app.js','utf8');
// Unit seam only: skip initial rendering, expose the actual private pure helper.
// Production source is never changed by this fixture; screen proof is separate.
const seam=source.replace(/\n  render\(\);\n\}\)\(\);\s*$/,'\n  window.formLinkTest = { publicFormLink, formLinkCopy };\n})();');
assert.notEqual(seam,source,'Expected the actual final render boundary');
const labels=JSON.parse(readFileSync(new URL('./fixtures/form-link.json',import.meta.url),'utf8'));

function fixture(publicBase){
 const location=new URL('https://PRIVATE:SECRET@localhost/other/apply/?lang=en&recruiter=yana&src=PRIVATE_SOURCE&campaign=PRIVATE_CAMPAIGN&vacancy=PRIVATE_VACANCY&phone=PRIVATE_PHONE#PRIVATE_HASH');
 const window={location,addEventListener(){}};
 const context=vm.createContext({window,URL,Intl,Date,console,navigator:{},localStorage:{getItem(){return null;}},document:{getElementById(id){return id==='app'?{}:null;}},fetch(){throw Error('No network in public-link unit fixture');}});
 for(const file of ['config','i18n-core','i18n-caucasus-central','i18n-asia','i18n-extra','i18n-mobile','translations'])vm.runInContext(readFileSync('apply/'+file+'.js','utf8'),context,{filename:'apply/'+file+'.js'});
 if(publicBase!==undefined)window.CITRONEX_SIMPLE_CONFIG=Object.freeze({...window.CITRONEX_SIMPLE_CONFIG,publicFormUrl:publicBase});
 vm.runInContext(seam,context,{filename:'apply/app.js:unit-seam'});
 return {build:window.formLinkTest.publicFormLink,copy:window.formLinkTest.formLinkCopy,config:window.CITRONEX_SIMPLE_CONFIG,languages:window.CITRONEX_SIMPLE_I18N.languages,location};
}

test('all600 public form links contain only validated enums and round-trip through the configured application URL',()=>{
 const f=fixture(),before=f.location.href,urls=new Set();let cases=0;
 for(const language of Object.keys(f.languages))for(const recruiter of f.config.recruiters)for(const location of ['',...f.config.locations]){
  const href=f.build(language,recruiter.id,location),url=new URL(href);urls.add(href);cases++;
  assert.equal(url.origin,'https://oleksandrkiris.github.io');assert.equal(url.pathname,'/kiris-jobs/apply/');
  assert.equal(url.username,'');assert.equal(url.password,'');assert.equal(url.hash,'');
  assert.deepEqual([...url.searchParams.keys()],location?['lang','recruiter','location']:['lang','recruiter']);
  assert.equal(url.searchParams.get('lang'),language);assert.equal(url.searchParams.get('recruiter'),recruiter.id);assert.equal(url.searchParams.get('location'),location||null);
  assert(!href.includes('PRIVATE')&&!href.includes('SECRET')&&!href.includes('localhost'));
 }
 assert.equal(cases,600);assert.equal(urls.size,600);assert.equal(f.location.href,before);
});

test('public form links reject invalid/prototype/typed selections instead of serialising arbitrary values',()=>{
 const {build}=fixture();
 for(const language of ['__proto__','constructor','prototype','EN','en<script>','',null,{},42])assert.throws(()=>build(language,'yana','any'));
 for(const recruiter of ['__proto__','constructor','PRIVATE_EMAIL@example.test','',null,{},42])assert.throws(()=>build('en',recruiter,'any'));
 for(const location of ['__proto__','constructor','PRIVATE_ADDRESS','bogatynia&phone=PRIVATE',null,{},42])assert.throws(()=>build('en','yana',location));
 assert.equal(new URL(build('en','yana')).searchParams.has('location'),false);
});

test('configured public bases cannot carry credentials, private query/hash or a non-HTTPS destination',()=>{
 for(const base of ['not-a-url','javascript:alert(1)','http://example.test/apply/','//example.test/apply/','https://PRIVATE:SECRET@example.test/apply/','https://example.test/apply/?token=PRIVATE','https://example.test/apply/#PRIVATE']){
  const {build}=fixture(base);assert.throws(()=>build('en','yana','siechnice'));
 }
});

test('separate configured fixture companies keep their own base while source-page route/private data stay excluded',()=>{
 const a=fixture('https://a.example.test/client-a/apply/'),b=fixture('https://b.example.test/client-b/apply/');
 for(const f of [a,b]){
  const url=new URL(f.build('uk','yuliia','ryczywol'));assert.deepEqual([...url.searchParams.entries()],[['lang','uk'],['recruiter','yuliia'],['location','ryczywol']]);assert(!url.href.includes('PRIVATE'));
 }
 assert.equal(new URL(a.build('en','yana')).origin,'https://a.example.test');assert.equal(new URL(b.build('en','yana')).origin,'https://b.example.test');
});

test('the new component has seven authored labels for every existing language without changing the locale registry',()=>{
 const f=fixture();assert.deepEqual(Object.keys(labels).sort(),Object.keys(f.languages).sort());assert.deepEqual(JSON.parse(JSON.stringify(f.copy)),labels);
 for(const [language,row] of Object.entries(labels)){
  assert.equal(row.length,7);assert(row.every(value=>typeof value==='string'&&value.trim()));if(language!=='en')for(let i=0;i<row.length;i++)assert.notEqual(row[i],labels.en[i]);
 }
});
