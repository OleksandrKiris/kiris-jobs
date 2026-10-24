// Anonymous draft-storage faults on the authorized Actions runner only.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {staticOrigin} from './static-origin.mjs';
import {inventory} from '../../scripts/build-pages-artifact.mjs';
assert.equal(process.env.GITHUB_ACTIONS,'true','Use only the authorized Actions runner');
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PACKAGE);
const artifact=resolve(process.env.PAGES_ARTIFACT),reportDir=resolve(process.env.BROWSER_REPORT);await mkdir(reportDir,{recursive:true});
const git=(...args)=>execFileSync('git',args),sha=b=>createHash('sha256').update(b).digest('hex');
const publishedMain='0fea01ce9bdeba339d6648f846bdcb966d745429',diagnostic=process.env.GITHUB_EVENT_NAME==='push';
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,publishedMain,diagnostic,checkout:git('rev-parse','HEAD').toString().trim(),files:{},rows:[],mutations:[],external:[],limits:['Anonymous isolated browser storage only; no candidate data or delivery.','Chromium320/1280; not physical-device, offline or native-speaker certification.']};
if(diagnostic){assert.equal(report.checkout,report.head);assert.equal(git('rev-parse','HEAD^').toString().trim(),report.base);}else{assert.deepEqual(git('show','-s','--format=%P','HEAD').toString().trim().split(' '),[report.base,report.head]);assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),git('rev-parse',report.head+'^{tree}').toString().trim());}
for(const {path:p}of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,b=await readFile(join(artifact,p));assert.deepEqual(b,git('show',`${report.head}:${source}`));const publishedExact=b.equals(git('show',`${publishedMain}:${source}`));if(diagnostic)assert(publishedExact,'Diagnostic inputs must equal published main: '+p);report.files[p]={source,bytes:b.length,sha256:sha(b),publishedExact};
}
assert.equal(Object.keys(report.files).length,317);
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-draft-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';let browser;
const key='citronex_screening_application_v17';
async function context(width){
 const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);
 await ctx.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({method:q.method(),path:u.pathname,blocked:true});return r.abort();}if(u.origin!==new URL(base).origin){report.external.push({host:u.hostname,path:u.pathname,blocked:true});return r.abort();}return r.continue();});
 await ctx.addInitScript(()=>{
  const store=window.localStorage,read=store.getItem.bind(store),write=store.setItem.bind(store),remove=store.removeItem.bind(store);
  window.__draftStorageMode='normal';window.__draftRead=()=>read('citronex_screening_application_v17');window.__unrelatedRead=()=>read('primserv-fixture-unrelated');write('primserv-fixture-unrelated','KEEP');
  Object.defineProperty(window,'localStorage',{configurable:true,get(){if(window.__draftStorageMode==='getter')throw new DOMException('Anonymous fixture storage access denied','SecurityError');return {getItem:read,removeItem:remove,setItem(k,v){if(window.__draftStorageMode==='quota')throw new DOMException('Anonymous fixture quota failure','QuotaExceededError');write(k,v);}};}});
 });return ctx;
}
async function enter(page,lang){await page.goto(base+'apply/');await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();await page.locator('[data-recruiter="yana"]').click();await page.locator('#firstName').fill('OLD');}
async function mode(page,value){await page.evaluate(v=>window.__draftStorageMode=v,value);}
async function raw(page){return page.evaluate(()=>window.__draftRead());}
async function baseline(width,fault){
 const ctx=await context(width),page=await ctx.newPage(),warnings=[],errors=[];page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
 try{
  await enter(page,'en');const before=await raw(page);assert.equal(JSON.parse(before).data.firstName,'OLD');await mode(page,fault);await page.locator('#firstName').fill('CURRENT');assert.equal(await page.locator('#firstName').inputValue(),'CURRENT');assert.equal(await raw(page),before);assert.equal(await page.evaluate(()=>document.activeElement.id),'firstName');assert.equal(await page.locator('[role="status"]').count(),0);assert(warnings.some(x=>x.startsWith('Draft save failed.')));await page.screenshot({path:join(reportDir,`baseline-${width}-${fault}.png`)});
  await mode(page,'normal');await page.locator('#firstName').fill('RECOVERED');assert.equal(JSON.parse(await raw(page)).data.firstName,'RECOVERED');await page.reload();await page.locator('[data-action="resume"]').click();assert.equal(await page.locator('#firstName').inputValue(),'RECOVERED');assert.equal(await page.evaluate(()=>window.__unrelatedRead()),'KEEP');assert.deepEqual(errors,[]);report.rows.push({width,fault,lang:'en',normalWrite:true,failedWritePreservedLastDraft:true,currentInputPreserved:true,noVisibleStatus:true,consoleWarningObserved:true,recoveredOnNextInput:true,reloadResumedRecovered:true,unrelatedPreserved:true,noDelivery:true,warnings});
 }catch(e){await page.screenshot({path:join(reportDir,`failure-${width}-${fault}.png`)}).catch(()=>{});throw e;}finally{await ctx.close();}
}
try{await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();assert(diagnostic,'Feature scenarios must be authored before PR acceptance');for(const width of [320,1280])for(const fault of ['getter','quota'])await baseline(width,fault);assert.equal(report.rows.length,4);assert.deepEqual(report.mutations,[]);assert.deepEqual(report.external,[]);report.status='BASELINE_4_RENDERED_FAULTS_NO_VISIBLE_DRAFT_STATUS';}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
