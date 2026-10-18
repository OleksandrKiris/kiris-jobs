import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const codes=['ru','uk','pl','en','az','ka','id','es','fil','ne','hy'];
const source=fs.readFileSync(new URL('assets/application-form.js',root),'utf8');
const marker='  window.PortalApplication = { open, clarify, clarifyGeneral, buildMessage };';
assert.ok(source.includes(marker));
function harness(){
 const window={location:new URL('https://fixture.invalid/kiris-jobs/?lang=ru')};
 const c=vm.createContext({window,URL,Intl,Date,console,document:{getElementById:()=>null},fetch:()=>{throw Error('No network in fixture');}});
 for(const f of ['data/content.js',...codes.map(code=>`data/locales/${code}.js`)])vm.runInContext(fs.readFileSync(new URL(f,root),'utf8'),c);
 const i18n=window.PortalI18n={locale:'ru',t(path){return path.split('.').reduce((v,k)=>v?.[k],window.PORTAL_TRANSLATIONS[this.locale])||path;},subscribe(){}};
 vm.runInContext(source.replace(marker,marker+'\n  window.errorTest={state,setError,refreshErrorLanguage,setValidationError,validateStep,validateMatchStep,submissionErrorMessage,candidateEngineCopy};'),c);
 return {api:window.errorTest,i18n};
}
for(const code of codes)test(`${code}: current errors translate without validating, advancing, or altering answers`,()=>{
 const {api:a,i18n}=harness();
 const cases=[['missing',{},'form.missingRequired',['firstName','lastName','phone']],['latin',{firstName:'ТЕСТ',lastName:'FIXTURE',phone:'+123'},'form.latinError',['firstName']],['phone',{firstName:'QA',lastName:'FIXTURE',phone:'+123'},'form.phoneError',['phone']]];
 for(const [kind,values,key,fields]of cases){
  i18n.locale=code==='en'?'ru':'en';a.state.jobId='banana-warehouse-poland';a.state.step=0;a.state.values={preferredLanguage:i18n.locale,...values};
  assert.equal(a.validateStep(),false);assert.equal(a.state.error,i18n.t(key));assert.deepEqual(Array.from(a.state.invalidFields),fields);
  const prior=JSON.stringify(a.state.values);const step=a.state.step;const original=a.state.error;
  i18n.locale=code;a.refreshErrorLanguage();assert.equal(a.state.error,i18n.t(key));assert.notEqual(a.state.error,original);assert.equal(JSON.stringify(a.state.values),prior);assert.equal(a.state.step,step);assert.deepEqual(Array.from(a.state.invalidFields),fields);
  a.setError('');a.refreshErrorLanguage();assert.equal(a.state.error,'','Cleared errors must not return');
 }
 // Other pre-existing error sources use the same in-memory resolver, without API calls.
 for(const key of ['form.dateError','form.groupCodeError','form.consentError','form.precheckNotSuitable','form.botCheckError','form.unavailableOffline']){
  i18n.locale='ru';a.setValidationError(()=>i18n.t(key),['fixture']);i18n.locale=code;a.refreshErrorLanguage();assert.equal(a.state.error,i18n.t(key));
 }
 for(const errorCode of ['configuration_error','invalid_request','rate_limited','delivery_failed','vacancy_unavailable','unknown']){
  i18n.locale='ru';a.setError(()=>a.submissionErrorMessage(errorCode));i18n.locale=code;a.refreshErrorLanguage();assert.equal(a.state.error,a.submissionErrorMessage(errorCode));
 }
 a.setError('Literal fixture message');i18n.locale='en';a.refreshErrorLanguage();assert.equal(a.state.error,'Literal fixture message');
});
test('underage copy resolver and matcher errors follow locale; empty matcher error stays empty',()=>{
 const {api:a,i18n}=harness();a.setValidationError(()=>a.candidateEngineCopy().underage,['birthDate']);for(const code of codes){i18n.locale=code;a.refreshErrorLanguage();assert.equal(a.state.error,a.candidateEngineCopy().underage);}
 a.state.values={};a.state.matchStep=0;assert.equal(a.validateMatchStep(),false);i18n.locale='pl';a.refreshErrorLanguage();assert.equal(a.state.error,i18n.t('form.missingRequired'));a.setError('');i18n.locale='uk';a.refreshErrorLanguage();assert.equal(a.state.error,'');
});
