// Only anonymous drafts on the authorized Actions runner; never user storage.
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
const git=(...a)=>execFileSync('git',a),sha=b=>createHash('sha256').update(b).digest('hex'),publishedMain='4e1a93e54f48cc00c19be5256e13e91e6d4491e5';
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,publishedMain,checkout:git('rev-parse','HEAD').toString().trim(),files:{},rows:[],mutations:[],external:[],limits:['Anonymous runner storage only. No real candidate drafts, delivery or external mutations.','Observational baseline of unchanged published runtime; not a device, offline or screen-reader certificate.']};
assert.equal(report.checkout,report.head);assert.equal(git('rev-parse','HEAD^').toString().trim(),report.base);assert.equal(report.base,publishedMain);
for(const {path:p}of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,b=await readFile(join(artifact,p));assert.deepEqual(b,git('show',`${report.head}:${source}`));assert.deepEqual(b,git('show',`${publishedMain}:${source}`));report.files[p]={source,bytes:b.length,sha256:sha(b),publishedExact:true};
}assert.equal(Object.keys(report.files).length,317);
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-dismiss-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';let browser;
const key='citronex_screening_application_v17';
async function run(width,fault){
 const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);
 await ctx.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({method:q.method(),path:u.pathname,blocked:true});return r.abort();}if(u.origin!==new URL(base).origin){report.external.push({host:u.hostname,path:u.pathname,blocked:true});return r.abort();}return r.continue();});
 await ctx.addInitScript(()=>{
  const store=window.localStorage,read=store.getItem.bind(store),write=store.setItem.bind(store),remove=store.removeItem.bind(store);
  if(!sessionStorage.getItem('primserv-dismiss-seeded')){
   write('citronex_screening_application_v17',JSON.stringify({version:'17.0.0',id:'KAND-ANONYMOUS-DISMISS-FIXTURE',routeKey:'||||',language:'en',recruiterId:'yana',step:1,data:{firstName:'ANONYMOUS_DRAFT',lastName:'FIXTURE',phone:'+99912345678',messenger:'telegram',citizenship:'FIXTURE',gender:'undisclosed',age:'30',location:'any',stayDuration:'six',physicalWork:'no',physicalDetails:'',performanceMetrics:'no',fastPace:'no',watchedVideos:'no',understandsRole:'no',longHours:'no',consent:false},savedAt:Date.now()}));write('primserv-dismiss-unrelated','KEEP');sessionStorage.setItem('primserv-dismiss-seeded','1');
  }
  window.__dismissMode='normal';window.__dismissCalls=[];window.__rawDraft=()=>read('citronex_screening_application_v17');window.__unrelated=()=>read('primserv-dismiss-unrelated');
  Object.defineProperty(window,'localStorage',{configurable:true,get(){if(window.__dismissMode==='getter')throw new DOMException('Anonymous fixture storage access denied','SecurityError');return {getItem:read,setItem:write,removeItem(k){window.__dismissCalls.push(k);if(window.__dismissMode==='remove')throw new DOMException('Anonymous fixture removal denied','SecurityError');remove(k);}};}});
 });
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'apply/');assert.equal(await page.locator('.draft-box').count(),1);const before=await page.evaluate(()=>window.__rawDraft());assert.equal(JSON.parse(before).data.firstName,'ANONYMOUS_DRAFT');assert.equal(await page.locator('#draftStatus').getAttribute('data-state'),'saved');
  await page.evaluate(fault=>window.__dismissMode=fault,fault);await page.locator('[data-action="resume"]').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'discard');assert(await page.locator('[data-action="discard"]').evaluate(n=>n.matches(':focus-visible')&&getComputedStyle(n).outlineStyle!=='none'));await page.keyboard.press('Enter');
  assert.equal(await page.locator('.draft-box').count(),0);const after=await page.evaluate(()=>({raw:window.__rawDraft(),calls:window.__dismissCalls,status:document.getElementById('draftStatus').textContent,state:document.getElementById('draftStatus').dataset.state,focus:document.activeElement.id||document.activeElement.tagName}));
  assert.equal(after.raw,fault==='normal'?null:before);assert.equal(after.state,'idle');assert.equal(after.status,'');assert.deepEqual(after.calls,fault==='getter'?[]:[key]);assert.equal(await page.evaluate(()=>window.__unrelated()),'KEEP');
  await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(reportDir,`dismiss-${width}-${fault}-after.png`)});
  await page.reload();const returned=await page.locator('.draft-box').count();assert.equal(returned,fault==='normal'?0:1);assert.equal(await page.evaluate(()=>window.__rawDraft()),fault==='normal'?null:before);
  if(fault!=='normal'){await page.locator('[data-action="resume"]').click();assert.equal(await page.locator('#firstName').inputValue(),'ANONYMOUS_DRAFT');assert.equal(await page.locator('#lastName').inputValue(),'FIXTURE');assert.equal(await page.locator('#phone').inputValue(),'+99912345678');}
  assert.equal(await page.evaluate(()=>window.__unrelated()),'KEEP');assert.deepEqual(errors,[]);
  report.rows.push({width,fault,lang:'en',status:'observed',nativeTabEnter:true,publishedRuntimeExact:true,after:{...after,raw:after.raw===null?null:'EXACT_ANONYMOUS_OLD'},successfulRemoval:fault==='normal',silentFailedRemoval:fault!=='normal',oldDraftReappearsOnReload:returned===1,reloadExactOld:fault!=='normal',unrelatedPreserved:true,noDelivery:true});
 }catch(e){await page.screenshot({path:join(reportDir,`failure-dismiss-${width}-${fault}.png`)}).catch(()=>{});throw e;}finally{await ctx.close();}
}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();for(const width of [320,1280])for(const fault of ['normal','getter','remove'])await run(width,fault);assert.equal(report.rows.length,6);assert.deepEqual(report.mutations,[]);assert.deepEqual(report.external,[]);report.applicationDeliveryAttempts=0;report.status='BASELINE_6_DISMISSALS_4_SILENT_FAILED_REMOVALS_OLD_RETURNS';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
