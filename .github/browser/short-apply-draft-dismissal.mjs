// Isolated anonymous drafts on the Actions runner only; no candidate delivery.
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
const git=(...a)=>execFileSync('git',a),sha=b=>createHash('sha256').update(b).digest('hex');
const messages=JSON.parse(await readFile(new URL('./fixtures/short-apply-draft-dismissal.json',import.meta.url),'utf8'));assert.equal(Object.keys(messages).length,20);
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout:git('rev-parse','HEAD').toString().trim(),files:{},rows:[],captures:[],mutations:[],external:[],limits:['Anonymous disposable browser storage only; no real drafts, accounts, mail or application delivery.','Capture scrolls the persistent global status into view; no sticky banner, complete-page/device/offline/native-speaker or actual screen-reader announcement certificate.','The exact accepted observational baseline and both rejected diagnostic sources remain in Git history and local proof.']};
assert.deepEqual(git('show','-s','--format=%P','HEAD').toString().trim().split(' '),[report.base,report.head]);assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),git('rev-parse',report.head+'^{tree}').toString().trim());
for(const {path:p}of inventory(artifact)){const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,b=await readFile(join(artifact,p));assert.deepEqual(b,git('show',`${report.head}:${source}`));report.files[p]={source,bytes:b.length,sha256:sha(b),publishedExact:b.equals(git('show',`${report.base}:${source}`))};}assert.equal(Object.keys(report.files).length,317);
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-dismiss-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';let browser;
const key='citronex_screening_application_v17';
async function context(width,lang,review){
 const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);
 await ctx.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({method:q.method(),path:u.pathname,blocked:true});return r.abort();}if(u.origin!==new URL(base).origin){report.external.push({host:u.hostname,path:u.pathname,blocked:true});return r.abort();}return r.continue();});
 await ctx.addInitScript(({lang,review})=>{
  const store=window.localStorage,read=store.getItem.bind(store),write=store.setItem.bind(store),remove=store.removeItem.bind(store);
  if(!sessionStorage.getItem('primserv-dismiss-seeded')){
   write('citronex_screening_application_v17',JSON.stringify({version:'17.0.0',id:'KAND-ANONYMOUS-DISMISS-FIXTURE',routeKey:'||||',language:lang,recruiterId:'yana',step:review?3:1,data:{firstName:'ANONYMOUS_DRAFT',lastName:'FIXTURE',phone:'+99912345678',messenger:'telegram',citizenship:'FIXTURE',gender:'undisclosed',age:'30',location:'any',stayDuration:'six',physicalWork:'no',physicalDetails:'',performanceMetrics:'no',fastPace:'no',watchedVideos:'no',understandsRole:'no',longHours:'no',consent:review},savedAt:Date.now()}));write('primserv-dismiss-unrelated','KEEP');sessionStorage.setItem('primserv-dismiss-seeded','1');
  }
  window.__dismissMode='normal';window.__dismissCalls=[];window.__rawDraft=()=>read('citronex_screening_application_v17');window.__unrelated=()=>read('primserv-dismiss-unrelated');
  Object.defineProperty(window,'localStorage',{configurable:true,get(){if(window.__dismissMode==='getter')throw new DOMException('Anonymous fixture storage access denied','SecurityError');return {getItem:read,setItem:write,removeItem(k){window.__dismissCalls.push(k);if(window.__dismissMode==='remove')throw new DOMException('Anonymous fixture removal denied','SecurityError');remove(k);}};}});
 },{lang,review});return ctx;
}
async function raw(page){return page.evaluate(()=>window.__rawDraft());}
async function mode(page,fault){await page.evaluate(v=>{window.__dismissMode=v;window.__dismissCalls=[];},fault);}
async function nativeAction(page,review){
 await page.locator(`[data-action="${review?'edit':'resume'}"]`).focus();const background=await page.locator(`[data-action="${review?'new':'discard'}"]`).evaluate(n=>getComputedStyle(n).backgroundColor);await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),review?'new':'discard');const focus=await page.evaluate(background=>{const n=document.activeElement,c=getComputedStyle(n);return {focusVisible:n.matches(':focus-visible'),outlined:c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>0,backgroundChanged:c.backgroundColor!==background&&c.backgroundColor!=='rgba(0, 0, 0, 0)',background:c.backgroundColor,unfocusedBackground:background};},background);assert(focus.focusVisible&&(focus.outlined||focus.backgroundChanged));await page.keyboard.press('Enter');return focus;
}
async function failed(page,lang,review){
 const n=page.locator('#draftStatus');assert.equal(await n.innerText(),messages[lang]);assert.equal(await n.getAttribute('data-state'),'clearFailed');assert.equal(await n.getAttribute('role'),'status');assert.equal(await n.getAttribute('aria-live'),'polite');assert.equal(await n.getAttribute('aria-atomic'),'true');assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),review?'new':'discard');assert.equal(await page.locator(review?'.review-sections':'.draft-box').count(),1);
}
async function shot(page,width,lang,kind,selector){
 const focused=await page.evaluate(()=>document.activeElement.dataset.action);await page.evaluate(()=>document.fonts.ready);await page.locator(selector).evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(150);const dom=await page.locator(selector).evaluate(n=>{const f=n.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(n);return {text:n.textContent,painted:n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),fit:document.documentElement.scrollWidth<=innerWidth+1&&n.scrollWidth<=n.clientWidth+1&&f.left>=0&&f.right<=innerWidth+1&&[...range.getClientRects()].every(r=>r.left>=f.left-1&&r.right<=f.right+1),rect:{x:f.x,y:f.y,width:f.width,height:f.height}};});assert(dom.painted&&dom.fit);const file=`dismiss-${width}-${lang}-${kind}.png`;await page.locator(selector).screenshot({path:join(reportDir,file)});assert.deepEqual(await page.locator(selector).boundingBox(),dom.rect);assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),focused);report.captures.push({file,width,lang,kind,dom,stable:true,focusPreserved:true});
}
async function enterReview(page){await page.locator('[data-action="resume"]').click();await page.locator('[data-action="next"]').click();await page.locator('.review-sections').waitFor();}
async function part(width,lang,review){
 const ctx=await context(width,lang,review),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const faults=[];
 try{
  await page.goto(base+'apply/');if(review)await enterReview(page);
  for(const fault of ['getter','remove']){
   const before=await raw(page),shown=review?await page.locator('.review-sections').innerText():null;
   await page.evaluate(review=>{window.__keptNode=document.querySelector(review?'.review-sections':'.draft-box');window.__statusChanges=[];new MutationObserver(rs=>window.__statusChanges.push(...rs.map(r=>r.type))).observe(document.getElementById('draftStatus'),{childList:true,subtree:true,characterData:true});},review);
   await mode(page,fault);await nativeAction(page,review);await failed(page,lang,review);assert.equal(await raw(page),before);assert(await page.evaluate(review=>window.__keptNode===document.querySelector(review?'.review-sections':'.draft-box'),review));if(review)assert.equal(await page.locator('.review-sections').innerText(),shown);assert.deepEqual(await page.evaluate(()=>window.__dismissCalls),fault==='getter'?[]:[key]);
   assert.equal(await page.evaluate(()=>window.__statusChanges.length),1);await page.evaluate(()=>window.__statusChanges=[]);await page.keyboard.press('Enter');await failed(page,lang,review);assert.equal(await page.evaluate(()=>window.__statusChanges.length),0);assert.equal(await raw(page),before);
   if(fault==='getter'){if(review)await shot(page,width,lang,'review-actions','.review-actions');else{await shot(page,width,lang,'error-status','#draftStatus');await shot(page,width,lang,'kept-card','.draft-box');}}
   await page.reload();assert.equal(await raw(page),before,'Failed removal must not replace the old draft during pagehide');assert.equal(await page.locator('.draft-box').count(),1);assert.equal(await page.evaluate(()=>window.__unrelated()),'KEEP');if(review)await enterReview(page);
   faults.push({fault,notice:true,nativeKeyboard:true,visibleFocus:true,currentViewAndAnswersKept:true,sameDOMNode:true,exactSavedDraftKeptAfterReload:true,noBlankOverwrite:true,repeatedLiveTextNotUpdated:true});
  }
  await mode(page,'normal');await nativeAction(page,review);assert.equal(await raw(page),null);assert.equal(await page.locator('.draft-box').count(),0);assert.equal(await page.locator('#draftStatus').innerText(),'');assert.equal(await page.locator('#draftStatus').getAttribute('data-state'),'idle');for(let i=0;i<2;i++){await page.reload();assert.equal(await raw(page),null);assert.equal(await page.locator('.draft-box').count(),0);assert.equal(await page.locator('#draftStatus').innerText(),'');}
  await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();await page.locator('[data-recruiter="yana"]').click();await page.locator('#firstName').fill('NEW_ANONYMOUS_DRAFT');const fresh=JSON.parse(await raw(page));assert.equal(fresh.data.firstName,'NEW_ANONYMOUS_DRAFT');assert.equal(fresh.data.lastName,'');assert.equal(fresh.data.phone,'');assert.notEqual(fresh.id,'KAND-ANONYMOUS-DISMISS-FIXTURE');assert.equal(await page.locator('#draftStatus').getAttribute('data-state'),'saved');await page.reload();await page.locator('[data-action="resume"]').click();assert.equal(await page.locator('#firstName').inputValue(),'NEW_ANONYMOUS_DRAFT');assert.equal(await page.locator('#lastName').inputValue(),'');assert.equal(await page.evaluate(()=>window.__unrelated()),'KEEP');assert.deepEqual(errors,[]);
  return {entry:review?'review-new':'initial-discard',faults,normalClear:true,twoReloadsRemainEmpty:true,newInputSavedAndResumed:true,noOldAnswerLeak:true,unrelatedPreserved:true,noDelivery:true};
 }catch(e){await page.screenshot({path:join(reportDir,`failure-dismiss-${width}-${lang}-${review?'review':'initial'}.png`)}).catch(()=>{});throw e;}finally{await ctx.close();}
}
async function run(width,lang){const initial=await part(width,lang,false),review=await part(width,lang,true);report.rows.push({width,lang,status:'passed',initial,review,noDelivery:true});}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();const cases=[320,1280].flatMap(width=>Object.keys(messages).map(lang=>({width,lang})));let next=0;await Promise.all(Array.from({length:2},async()=>{while(next<cases.length){const c=cases[next++];await run(c.width,c.lang);}}));assert.equal(report.rows.length,40);assert.equal(report.captures.length,120);assert.deepEqual(report.mutations,[]);assert.deepEqual(report.external,[]);report.applicationDeliveryAttempts=0;report.status='PASSED_40_DISMISSAL_FLOWS_BOTH_ENTRIES_160_FAULTS_80_CLEARS_120_FRAGMENTS';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
