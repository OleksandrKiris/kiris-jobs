// Authorized Actions-only anonymous fixtures. Never run a local origin elsewhere.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {staticOrigin} from './static-origin.mjs';
import {FORM_ERROR_LABELS,cachedFormHash} from './catalogue-form-errors.mjs';
import {settledForm,fieldVisual,correctFieldVisual} from './catalogue-field-status.mjs';
import {inventory} from '../../scripts/build-pages-artifact.mjs';

assert.equal(process.env.GITHUB_ACTIONS,'true','Only the authorized Actions runner');
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PACKAGE);
const artifact=resolve(process.env.PAGES_ARTIFACT),reportDir=resolve(process.env.BROWSER_REPORT);
await mkdir(reportDir,{recursive:true});
const git=(...args)=>execFileSync('git',args),sha=b=>createHash('sha256').update(b).digest('hex');
const labels=JSON.parse(await readFile(new URL('./fixtures/inline-email-labels.json',import.meta.url),'utf8'));
assert.deepEqual(Object.keys(labels).sort(),Object.keys(FORM_ERROR_LABELS).sort());
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout:git('rev-parse','HEAD').toString().trim(),mode:'acceptance',started:new Date().toISOString(),files:{},rows:[],offlineRows:[],upgrades:[],oldRed:[],mutations:[],external:[],limits:['Desktop Chromium at 320/1280; no physical device certification.','Anonymous reserved-domain fixtures; no final delivery or external services.','Existing inline form only; previous 66 form-error scenarios remain independent.']};
assert.deepEqual(git('show','-s','--format=%P','HEAD').toString().trim().split(' '),[report.base,report.head]);
assert.equal(git('rev-parse',report.checkout+'^{tree}').toString().trim(),git('rev-parse',report.head+'^{tree}').toString().trim(),'PR merge tree must equal the exact reviewed head');
for(const {path:p} of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p;
 const bytes=await readFile(join(artifact,p));assert.deepEqual(bytes,git('show',`${report.head}:${source}`),p);
 report.files[p]={source,bytes:bytes.length,sha256:sha(bytes)};
}
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-email-'));
await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');
const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';
let browser;
async function locale(page,lang){await page.locator('.language-switcher-button').click();await page.locator(`[data-language-option="${lang}"]`).click();await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);}
async function values(page){return page.evaluate(()=>Object.fromEntries(['firstName','lastName','phone','email','preferredLanguage'].map(k=>[k,document.querySelector(`[name="${k}"]`).value])));}
async function context(width,serviceWorkers='block'){
 const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers,reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);
 await ctx.route('**/*',r=>{const q=r.request(),url=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({method:q.method(),path:url.pathname,blocked:true});return r.abort();}if(url.origin!==new URL(base).origin){report.external.push({host:url.hostname,path:url.pathname,blocked:true});return r.abort();}return r.continue();});return ctx;
}
async function resume(page){if(await page.locator('[data-resume-draft]').isVisible())await page.locator('[data-resume-draft]').click();await page.locator('#application-form').waitFor();}
async function run({width,lang,page:existingPage}){
 const own=!existingPage,ctx=own?await context(width):existingPage.context(),page=existingPage||await ctx.newPage(),errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
 if(own){await page.goto(base+`vacancies/banana-warehouse-poland/?lang=${lang}&apply=1`);await resume(page);}else await locale(page,lang);
 const fixture={firstName:'QA',lastName:'FIXTURE',phone:'+99912345678',email:'fixture.example.invalid'};
 for(const [name,value] of Object.entries(fixture))await page.locator(`[name="${name}"]`).fill(value);
 const before=await values(page);await page.locator('#application-form button[type="submit"]').click();
 await page.waitForFunction(()=>document.activeElement?.name==='email');await settledForm(page);
 const error=await page.locator('#application-error').innerText();assert.equal(error,labels[lang]);assert.notEqual(error,FORM_ERROR_LABELS[lang].missing);
 const associated=await page.locator('[name="email"]').evaluate(el=>el.closest('label')?.querySelector('.application-field-error')?.textContent===document.querySelector('#application-error').textContent);
 const visual=await fieldVisual(page);assert.equal(correctFieldVisual(visual),true);assert.equal(visual.length,1);assert.equal(visual[0].name,'email');
 const away=lang==='en'?'ru':'en';await locale(page,away);assert.equal(await page.locator('#application-error').innerText(),labels[away]);await locale(page,lang);assert.equal(await page.locator('#application-error').innerText(),error);assert.deepEqual(await values(page),before);
 await settledForm(page);
 const dom=await page.evaluate(()=>{const email=document.querySelector('[name="email"]'),field=email.closest('label'),alert=document.querySelector('#application-error');return {actualLang:document.documentElement.lang,required:email.required,type:email.type,label:field.textContent.trim(),inlineError:field.querySelector('.application-field-error').textContent,step:document.querySelector('.application-header').dataset.stage,painted:Number(getComputedStyle(document.querySelector('.application-step')).opacity)>=.99,fits:document.documentElement.scrollWidth<=innerWidth+1,errorVisible:!alert.hidden};});
 assert.equal(dom.required,false);assert.equal(dom.type,'email');assert.equal(dom.step,'1');assert.equal(dom.actualLang,lang);assert.equal(dom.painted,true);assert.equal(dom.fits,true);assert.equal(dom.errorVisible,true);assert.equal(associated,true);
 const prefix=own?'email':'email-offline';
 await page.locator('#application-error').screenshot({path:join(reportDir,`${prefix}-${width}-${lang}-alert.png`)});
 await page.locator('[name="email"]').locator('..').screenshot({path:join(reportDir,`${prefix}-${width}-${lang}-field.png`)});
 const recovery=[];
 for(const email of ['', 'fixture@example.invalid']){
  await page.locator('[name="email"]').fill(email);
  const cleared=await page.locator('#application-error').evaluate(el=>el.hidden);assert.equal(cleared,true);
  await page.locator('#application-form button[type="submit"]').click();await page.waitForFunction(()=>document.querySelector('.application-header')?.dataset.stage==='2');await settledForm(page);
  assert.equal(await page.locator('.application-success').count(),0);assert.equal(await page.locator('.whatsapp-submit').count(),0);
  await page.locator('[data-application-back]').click();await page.locator('[name="email"]').waitFor();await settledForm(page);
  assert.deepEqual(await values(page),{...before,email});recovery.push({email,cleared,advancedToStep2:true,backPreserved:true});
 }
 assert.deepEqual(errors,[]);page.off('pageerror',onError);(own?report.rows:report.offlineRows).push({width,lang,error,focusedEmail:true,associated,invalidVisual:true,preserved:true,roundTrip:true,notSubmitted:true,...dom,recovery,status:'passed'});if(own)await ctx.close();
}
async function upgrade(width){
 const paths=['sw.js','assets/application-form.js',...Object.keys(labels).map(c=>`data/locales/${c}.js`)];
 const headFiles=new Map(await Promise.all(paths.map(async p=>[p,await readFile(join(artifact,p))])));
 const oldRef='30245b71cd152626f69a0b05685671f176bcc27a';
 const oldCache=git('show',oldRef+':sw.js').toString().match(/const CACHE_VERSION = "([^"]+)"/)[1],headCache=headFiles.get('sw.js').toString().match(/const CACHE_VERSION = "([^"]+)"/)[1];assert.notEqual(oldCache,headCache);
 const ctx=await context(width,'allow'),page=await ctx.newPage();let stopped=false;
 try{
  for(const p of paths)await writeFile(join(artifact,p),git('show',`${oldRef}:${p}`));
  await page.goto(base+'vacancies/banana-warehouse-poland/?lang=en&apply=1');await resume(page);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  for(const [name,value] of Object.entries({firstName:'QA',lastName:'FIXTURE',phone:'+99912345678',email:'fixture.example.invalid'}))await page.locator(`[name="${name}"]`).fill(value);
  await page.locator('#application-form button[type="submit"]').click();await settledForm(page);
  assert.equal(await page.locator('#application-error').innerText(),FORM_ERROR_LABELS.en.missing);
  const saved=await values(page),formUrl=new URL('assets/application-form.js?v=220&formErrorLocale=1',base).href;
  assert.equal(await cachedFormHash(page,oldCache,formUrl),sha(git('show',oldRef+':assets/application-form.js')));
  await page.locator('#application-error').screenshot({path:join(reportDir,`email-old-red-${width}-alert.png`)});await page.locator('[name="email"]').locator('..').screenshot({path:join(reportDir,`email-old-red-${width}-field.png`)});report.oldRed.push({width,ref:oldRef,error:FORM_ERROR_LABELS.en.missing,optional:true,status:'expected-failure'});
  for(const [p,bytes]of headFiles)await writeFile(join(artifact,p),bytes);
  await page.evaluate(async()=>{await(await navigator.serviceWorker.ready).update();});
  await page.waitForFunction(async({oldCache,headCache})=>{const keys=await caches.keys();return keys.includes(headCache)&&!keys.includes(oldCache);},{oldCache,headCache});
  await page.reload();await resume(page);assert.deepEqual(await values(page),saved);
  assert.equal(await cachedFormHash(page,headCache,formUrl),sha(headFiles.get('assets/application-form.js')));
  for(const lang of Object.keys(labels)){
   await locale(page,lang);const url=new URL(`data/locales/${lang}.js?v=220`,base).href;
   await page.waitForFunction(async({headCache,url})=>Boolean(await(await caches.open(headCache)).match(url)),{headCache,url});
   assert.equal(await cachedFormHash(page,headCache,url),sha(headFiles.get(`data/locales/${lang}.js`)));
  }
  await origin.stop();stopped=true;await ctx.setOffline(true);await assert.rejects(fetch(base));await page.reload();await resume(page);assert.deepEqual(await values(page),saved);
  for(const lang of Object.keys(labels))await run({width,lang,page});
  report.upgrades.push({width,ref:oldRef,oldCache,headCache,oldFormExact:true,newFormExact:true,localesExact:Object.keys(labels),originStopped:true,offlineReload:true,draftPreserved:true,status:'passed'});
 }finally{for(const[p,bytes]of headFiles)await writeFile(join(artifact,p),bytes);await ctx.close();if(stopped)await origin.start();}
}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();
 const cases=[320,1280].flatMap(width=>Object.keys(FORM_ERROR_LABELS).map(lang=>({width,lang})));let next=0;
 await Promise.all(Array.from({length:2},async()=>{while(next<cases.length)await run(cases[next++]);}));
 assert.equal(report.rows.length,22);for(const width of [320,1280])await upgrade(width);assert.equal(report.offlineRows.length,22);assert.equal(report.upgrades.length,2);
 // Existing funnel analytics are intercepted too. No mutation reaches the origin;
 // application delivery is forbidden even as an attempted request.
 assert(report.mutations.every(r=>r.blocked&&r.method==='POST'&&r.path==='/api/public/funnel'));report.applicationDeliveryAttempts=0;report.status='PASSED_OPTIONAL_EMAIL_ONLINE_OFFLINE_AND_EXACT_BASE_UPGRADE';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
