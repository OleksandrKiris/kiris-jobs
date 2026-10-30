// Observation of the existing online form, without changing or seeding its cache.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {staticOrigin} from './static-origin.mjs';
import {inventory} from '../../scripts/build-pages-artifact.mjs';
assert.equal(process.env.GITHUB_ACTIONS,'true','Only the authorized Linux Actions origin');
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PACKAGE);
const git=(...a)=>execFileSync('git',a),sha=b=>createHash('sha256').update(b).digest('hex');
const artifact=resolve(process.env.PAGES_ARTIFACT),reportDir=resolve(process.env.BROWSER_REPORT);await mkdir(reportDir,{recursive:true});
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout:git('rev-parse','HEAD').toString().trim(),files:{},rows:[],captures:[],external:[],mutations:[],limits:['Four EN/UR320/1280 desktop Chromium flows. No all-language, device, IME or screen-reader certification.','An already open form can run from memory. A saved local draft is not a cached executable application. Cache contents are only inspected, never seeded.','Exact short-form reload and an enum-only public-link query are observed with the real origin stopped and browser network disabled. Unavailability is an online boundary, not a claimed new regression or fix.','Only anonymous fixture names are entered. No messages, Clipboard, form submission, real accounts or candidate data.']};
assert.equal(report.checkout,report.head);assert.equal(git('show','-s','--format=%P','HEAD').toString().trim(),report.base);
const old=git('ls-tree','-r',report.base).toString().trim().split('\n');assert.equal(old.length,518);
for(const row of old){const [,p]=row.split('\t');if(p==='docs/primserv-roadmap.md')continue;assert.deepEqual(git('show',report.head+':'+p),git('show',report.base+':'+p),p);}report.priorTrackedUnchanged=517;
for(const {path:p}of inventory(artifact)){const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,b=await readFile(join(artifact,p));assert.deepEqual(b,git('show',report.head+':'+source));report.files[p]={source,bytes:b.length,sha256:sha(b),publishedExact:b.equals(git('show',report.base+':'+source))};}assert.equal(Object.keys(report.files).length,317);assert.equal(Object.values(report.files).filter(x=>x.publishedExact).length,316);
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-network-boundary-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/',key='citronex_screening_application_v17';let browser;
async function raw(page){return page.evaluate(k=>localStorage.getItem(k),key);}
async function cacheKeys(page){return page.evaluate(async()=>{const result=[];for(const name of await caches.keys()){const c=await caches.open(name);for(const r of await c.keys())result.push({name,url:r.url});}return result;});}
async function capture(page,width,lang,stage){
 await page.evaluate(()=>document.fonts.ready);const field=page.locator('#firstName').locator('..');await field.scrollIntoViewIfNeeded();
 const dom=await field.evaluate(n=>({text:n.innerText,value:n.querySelector('input').value,visible:n.checkVisibility(),fit:n.scrollWidth<=n.clientWidth+1,lang:document.documentElement.lang,pageFits:document.documentElement.scrollWidth<=innerWidth+1}));assert(dom.visible&&dom.fit&&dom.pageFits&&dom.lang===lang);
 const file=`network-${width}-${lang}-${stage}.png`;await field.screenshot({path:join(reportDir,file)});const bytes=await readFile(join(reportDir,file));report.captures.push({file,width,lang,stage,sha256:sha(bytes),dom,originalPixels:true});
}
async function unavailable(page,operation){let error;try{await operation();}catch(e){error=e.message;}assert(error&&/ERR_|net::/i.test(error),`Navigation unexpectedly succeeded: ${error}`);assert.equal(await page.locator('#candidateForm').count(),0);return error;}
async function run(width,lang){
 const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'allow',reducedMotion:'reduce'});ctx.setDefaultTimeout(20000);
 await ctx.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(!['GET','HEAD'].includes(r.method())){report.mutations.push({width,lang,method:r.method(),path:u.pathname,blocked:true});return route.abort();}if(u.origin!==new URL(base).origin){report.external.push({width,lang,host:u.hostname,path:u.pathname,blocked:true});return route.abort();}return route.continue();});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let witness;
 try{
  await origin.start();await page.goto(base);await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const entry=base+`apply/?lang=${lang}&recruiter=yana&location=siechnice`;await page.goto(entry);assert(await page.evaluate(()=>navigator.serviceWorker.controller.scriptURL.endsWith('/kiris-jobs/sw.js')));
  await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();await page.locator('[data-recruiter="yana"]').click();await page.locator('#firstName').fill('ONLINE FIXTURE');
  witness=await ctx.newPage();await witness.goto(base+'privacy.html');await witness.evaluate(()=>localStorage.setItem('network-boundary-unrelated','KEEP'));
  const before=JSON.parse(await raw(witness));assert.equal(before.data.firstName,'ONLINE FIXTURE');assert.equal(typeof before.id,'string');assert(before.id.length>0);const beforeKeys=await cacheKeys(witness);assert(beforeKeys.some(r=>r.url===base||r.url===base+'index.html'));assert.deepEqual(beforeKeys.filter(r=>new URL(r.url).pathname.includes('/apply/')),[]);
  await origin.stop();await assert.rejects(fetch(base));await ctx.setOffline(true);
  const input=page.locator('#firstName');await input.focus();await page.keyboard.press('Control+A');await page.keyboard.insertText('OFFLINE FIXTURE');assert.equal(await input.inputValue(),'OFFLINE FIXTURE');assert.equal(await page.evaluate(()=>document.activeElement.id),'firstName');
  const offline=JSON.parse(await raw(witness));assert.equal(offline.data.firstName,'OFFLINE FIXTURE');assert.equal(offline.id,before.id);await capture(page,width,lang,'offline-open');
  await page.locator('.form-link > summary').click();const publicUrl=new URL(await page.locator('#publicFormUrl').inputValue());assert.equal(publicUrl.origin,'https://oleksandrkiris.github.io');assert.equal(publicUrl.pathname,'/kiris-jobs/apply/');assert.deepEqual([...publicUrl.searchParams],[['lang',lang],['recruiter','yana'],['location','siechnice']]);
  await page.locator('#publicFormLocation').selectOption('bogatynia');const variant=new URL(await page.locator('#publicFormUrl').inputValue());assert.equal(variant.searchParams.get('location'),'bogatynia');assert.equal(await raw(witness),JSON.stringify(offline));
  const queryPage=await ctx.newPage();const queryError=await unavailable(queryPage,()=>queryPage.goto(base+'apply/'+variant.search));await queryPage.close();
  const reloadError=await unavailable(page,()=>page.reload());const retained=JSON.parse(await raw(witness));assert.deepEqual(retained.data,offline.data);assert.equal(retained.id,offline.id);assert.equal(await witness.evaluate(()=>localStorage.getItem('network-boundary-unrelated')),'KEEP');
  const afterKeys=await cacheKeys(witness);assert.deepEqual(afterKeys.filter(r=>new URL(r.url).pathname.includes('/apply/')),[]);
  await ctx.setOffline(false);await origin.start();await page.goto(entry);assert.equal(await page.locator('[data-action="resume"]').count(),1);await page.locator('[data-action="resume"]').focus();await page.keyboard.press('Enter');assert.equal(await input.inputValue(),'OFFLINE FIXTURE');assert.equal(await page.locator('#candidateForm').count(),1);assert.deepEqual(JSON.parse(await raw(witness)).data,offline.data);await capture(page,width,lang,'online-recovered');assert.deepEqual(errors,[]);
  report.rows.push({width,lang,status:'passed',rootWorkerControlled:true,cacheWasNotSeeded:true,beforeKeys,afterKeys,originReallyStopped:true,openFormOfflineEditingAndFocus:true,publicLinkGeneratedOfflineWithoutAnswers:true,exactReloadUnavailable:reloadError,queryEntryUnavailable:queryError,anonymousDraftPreserved:true,unrelatedKeyPreserved:true,onlineRecoveryWithNativeResume:true,noDelivery:true});
 }catch(e){report.failedCase??={width,lang,message:e.message,errors};await page.screenshot({path:join(reportDir,`failure-network-${width}-${lang}.png`)}).catch(()=>{});throw e;}finally{await ctx.setOffline(false);await ctx.close();await origin.stop();}
}
try{browser=await chromium.launch({headless:true});report.browser=browser.version();for(const width of [320,1280])for(const lang of ['en','ur'])await run(width,lang);assert.equal(report.rows.length,4);assert.equal(report.captures.length,8);assert.deepEqual(report.mutations,[]);report.applicationDeliveryAttempts=0;report.status='OBSERVED_OPEN_FORM_OFFLINE_AND_NETWORK_REQUIRED_RELOAD_WITH_DRAFT_RECOVERY_4_FLOWS';}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
