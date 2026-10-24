// Authorized Actions-only anonymous fixtures. Never run a local origin elsewhere.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {staticOrigin} from './static-origin.mjs';
import {FORM_ERROR_LABELS} from './catalogue-form-errors.mjs';
import {settledForm,fieldVisual,correctFieldVisual} from './catalogue-field-status.mjs';
import {inventory} from '../../scripts/build-pages-artifact.mjs';

assert.equal(process.env.GITHUB_ACTIONS,'true','Only the authorized Actions runner');
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PACKAGE);
const artifact=resolve(process.env.PAGES_ARTIFACT),reportDir=resolve(process.env.BROWSER_REPORT);
await mkdir(reportDir,{recursive:true});
const git=(...args)=>execFileSync('git',args),sha=b=>createHash('sha256').update(b).digest('hex');
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout:git('rev-parse','HEAD').toString().trim(),mode:'diagnostic',started:new Date().toISOString(),files:{},rows:[],mutations:[],external:[],limits:['Desktop Chromium at 320/1280; no physical device certification.','Anonymous reserved-domain fixtures; no final delivery or external services.','Diagnostic of existing inline form only; previous 66 form-error scenarios remain independent.']};
assert.equal(report.checkout,report.head);
for(const {path:p} of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p;
 const bytes=await readFile(join(artifact,p));assert.deepEqual(bytes,git('show',`${report.head}:${source}`),p);
 assert.deepEqual(bytes,git('show',`${report.base}:${source}`),`Diagnostic public source must remain unchanged: ${p}`);
 report.files[p]={source,bytes:bytes.length,sha256:sha(bytes)};
}
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-email-'));
await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');
const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';
let browser;
async function locale(page,lang){await page.locator('.language-switcher-button').click();await page.locator(`[data-language-option="${lang}"]`).click();await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);}
async function values(page){return page.evaluate(()=>Object.fromEntries(['firstName','lastName','phone','email','preferredLanguage'].map(k=>[k,document.querySelector(`[name="${k}"]`).value])));}
async function run({width,lang}){
 const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);
 await ctx.route('**/*',r=>{const q=r.request(),url=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({method:q.method(),path:url.pathname});return r.abort();}if(url.origin!==new URL(base).origin){report.external.push({host:url.hostname,path:url.pathname});return r.abort();}return r.continue();});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+`vacancies/banana-warehouse-poland/?lang=${lang}&apply=1`);await page.locator('#application-form').waitFor();
 const fixture={firstName:'QA',lastName:'FIXTURE',phone:'+99912345678',email:'fixture.example.invalid'};
 for(const [name,value] of Object.entries(fixture))await page.locator(`[name="${name}"]`).fill(value);
 const before=await values(page);await page.locator('#application-form button[type="submit"]').click();
 await page.waitForFunction(()=>document.activeElement?.name==='email');await settledForm(page);
 const error=await page.locator('#application-error').innerText();assert.equal(error,FORM_ERROR_LABELS[lang].missing);
 const associated=await page.locator('[name="email"]').evaluate(el=>el.closest('label')?.querySelector('.application-field-error')?.textContent===document.querySelector('#application-error').textContent);
 const visual=await fieldVisual(page);assert.equal(correctFieldVisual(visual),true);assert.equal(visual.length,1);assert.equal(visual[0].name,'email');
 const away=lang==='en'?'ru':'en';await locale(page,away);assert.equal(await page.locator('#application-error').innerText(),FORM_ERROR_LABELS[away].missing);await locale(page,lang);assert.equal(await page.locator('#application-error').innerText(),error);assert.deepEqual(await values(page),before);
 await settledForm(page);
 const dom=await page.evaluate(()=>{const email=document.querySelector('[name="email"]'),field=email.closest('label'),alert=document.querySelector('#application-error');return {actualLang:document.documentElement.lang,required:email.required,type:email.type,label:field.textContent.trim(),inlineError:field.querySelector('.application-field-error').textContent,step:document.querySelector('.application-header').dataset.stage,painted:Number(getComputedStyle(document.querySelector('.application-step')).opacity)>=.99,fits:document.documentElement.scrollWidth<=innerWidth+1,errorVisible:!alert.hidden};});
 assert.equal(dom.required,false);assert.equal(dom.type,'email');assert.equal(dom.step,'1');assert.equal(dom.actualLang,lang);assert.equal(dom.painted,true);assert.equal(dom.fits,true);assert.equal(dom.errorVisible,true);assert.equal(associated,true);
 await page.locator('#application-error').screenshot({path:join(reportDir,`email-${width}-${lang}-alert.png`)});
 await page.locator('[name="email"]').locator('..').screenshot({path:join(reportDir,`email-${width}-${lang}-field.png`)});
 const recovery=[];
 for(const email of ['', 'fixture@example.invalid']){
  await page.locator('[name="email"]').fill(email);
  const cleared=await page.locator('#application-error').evaluate(el=>el.hidden);assert.equal(cleared,true);
  await page.locator('#application-form button[type="submit"]').click();await page.waitForFunction(()=>document.querySelector('.application-header')?.dataset.stage==='2');await settledForm(page);
  assert.equal(await page.locator('.application-success').count(),0);assert.equal(await page.locator('.whatsapp-submit').count(),0);
  await page.locator('[data-application-back]').click();await page.locator('[name="email"]').waitFor();await settledForm(page);
  assert.deepEqual(await values(page),{...before,email});recovery.push({email,cleared,advancedToStep2:true,backPreserved:true});
 }
 assert.deepEqual(errors,[]);report.rows.push({width,lang,error,focusedEmail:true,associated,invalidVisual:true,preserved:true,roundTrip:true,notSubmitted:true,...dom,recovery,status:'observed'});await ctx.close();
}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();
 const cases=[320,1280].flatMap(width=>Object.keys(FORM_ERROR_LABELS).map(lang=>({width,lang})));let next=0;
 await Promise.all(Array.from({length:2},async()=>{while(next<cases.length)await run(cases[next++]);}));
 assert.equal(report.rows.length,22);assert.deepEqual(report.mutations,[]);report.status='DIAGNOSTIC_COMPLETE_GENERIC_REQUIRED_ERROR_ON_OPTIONAL_EMAIL';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
