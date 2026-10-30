// Inert window dependency: the unchanged application can only record a mailto.
// This intentionally does not test or launch an operating-system mail client.
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
const git=(...a)=>execFileSync('git',a),sha=b=>createHash('sha256').update(b).digest('hex');
const artifact=resolve(process.env.PAGES_ARTIFACT),reportDir=resolve(process.env.BROWSER_REPORT);
await mkdir(reportDir,{recursive:true});
const published='181088556b9494e66a6188a8597f85917b41b580',held='4ae8c3ccae83627fb9606c206b7644e3df9806d5';
const appSource=await readFile(join(artifact,'apply/app.js'),'utf8');
assert.deepEqual(Buffer.from(appSource),git('show',`${published}:apply/app.js`));
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,published,held,checkout:git('rev-parse','HEAD').toString().trim(),applicationSourceSha256:sha(appSource),files:{},rows:[],captures:[],external:[],mutations:[],observations:{falseOpenedOnAssignThrow:0,unhandledAssignThrows:0,overConfiguredLength:0,saveRefusals:0},limits:[
 'English only at320/1280. Instrumented window dependency and real Chromium DOM/styles; no uninstrumented mail-client/device/offline/screen-reader/native-speaker certification.',
 'The normal app.js request is replaced with an empty response. Its exact unchanged bytes are then executed with an inert window.location.assign dependency. No runtime source replacement or assignment can reach the native Location.',
 'A captured assign returning normally proves only the generated anonymous URL. It never proves that an email application opened or a message was sent.',
 'Assign and storage exceptions are synthetic fixture failures, not observed production or physical-device failures.',
 'Anonymous disposable storage only; no external request, mail client, real clipboard, accounts, candidate data or application delivery.'
]};
assert.equal(report.checkout,report.head);
assert.deepEqual(git('show','-s','--format=%P',report.head).toString().trim().split(' '),[report.base]);
git('merge-base','--is-ancestor',held,report.head);
const heldPaths=git('ls-tree','-r','--name-only',held).toString().trim().split('\n');assert.equal(heldPaths.length,506);
for(const p of heldPaths)assert.deepEqual(git('show',`${report.head}:${p}`),git('show',`${held}:${p}`),p);
report.previousHeldTrackedFilesExact=506;
for(const {path:p}of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,b=await readFile(join(artifact,p));
 assert.deepEqual(b,git('show',`${report.head}:${source}`));const exact=b.equals(git('show',`${published}:${source}`));
 assert(exact||source==='docs/primserv-roadmap.md',p);report.files[p]={source,bytes:b.length,sha256:sha(b),publishedExact:exact};
}
assert.equal(Object.keys(report.files).length,317);assert.equal(Object.values(report.files).filter(f=>f.publishedExact).length,316);
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-send-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');
const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';let browser;
const key='citronex_screening_application_v17';
const modes=[{name:'capture'},{name:'assign-throw',throws:true},{name:'unicode-encoded',unicode:true},{name:'long-anonymous',long:true},{name:'save-refused',saveRefused:true},{name:'save-refused-assign-throw',saveRefused:true,throws:true}];
async function context(width,test){
 const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);let suppressed=0;
 await ctx.route('**/*',route=>{const q=route.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({case:test.name,width,method:q.method(),path:u.pathname,blocked:true});return route.abort();}if(u.origin!==new URL(base).origin){report.external.push({case:test.name,width,host:u.hostname,path:u.pathname,blocked:true});return route.abort();}if(u.pathname==='/kiris-jobs/apply/app.js'){suppressed++;return route.fulfill({status:200,contentType:'text/javascript',body:'/* Inert dependency diagnostic: actual source is executed separately. */'});}return route.continue();});
 await ctx.addInitScript(({key,test})=>{
  const data={firstName:'ANONYMOUS',lastName:'FIXTURE',phone:'+99912345678',messenger:'telegram',citizenship:'FIXTURE',gender:'undisclosed',age:'30',location:'any',stayDuration:'six',physicalWork:'no',physicalDetails:'',performanceMetrics:'no',fastPace:'no',watchedVideos:'no',understandsRole:'no',longHours:'no',consent:true};
  if(test.unicode)Object.assign(data,{firstName:'Анонімний & = +',lastName:'Łódź? # %',citizenship:'QA\t=FIXTURE',physicalWork:'yes',physicalDetails:'ONLY FIXTURE\n=1+1\t@TEST'});
  if(test.long)Object.assign(data,{firstName:'Ж'.repeat(80),lastName:'Ф'.repeat(80),citizenship:'К'.repeat(80),physicalWork:'yes',physicalDetails:'🧪'.repeat(130)});
  localStorage.setItem(key,JSON.stringify({version:'17.0.0',id:'KAND-ANONYMOUS-SEND-FIXTURE',routeKey:'yana|any|fixture|autumn|anonymous',language:'en',recruiterId:'yana',step:3,data,savedAt:Date.now()}));
  localStorage.setItem('primserv-send-unrelated','KEEP');window.__sendFixture={assigns:[],timers:[],writes:[],warnings:[],suppressedNativeLocation:true};
 },{key,test});
 return {ctx,suppressed:()=>suppressed};
}
async function capture(page,width,test,stage,selector){
 await page.evaluate(()=>document.fonts.ready);await page.locator(selector).evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(100);
 const dom=await page.locator(selector).evaluate(n=>({text:n.innerText,visible:n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),fit:document.documentElement.scrollWidth<=innerWidth+1&&n.scrollWidth<=n.clientWidth+1,lang:document.documentElement.lang}));assert(dom.visible&&dom.fit&&dom.lang==='en');
 const file=`send-${width}-${test.name}-${stage}.png`;await page.locator(selector).screenshot({path:join(reportDir,file)});report.captures.push({file,width,case:test.name,stage,selector,dom});
}
async function run(width,test){
 const {ctx,suppressed}=await context(width,test),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'apply/?lang=en&recruiter=yana&location=any&src=fixture&campaign=autumn&vacancy=anonymous');
  assert.equal(suppressed(),1);assert.equal(await page.locator('#languageSearch').count(),0,'Native app must not have executed');
  const dependency=await page.evaluate(({source,test,key})=>{
   const fixture=window.__sendFixture,realStore=window.localStorage,realSet=realStore.setItem.bind(realStore),realGet=realStore.getItem.bind(realStore);
   const storage={getItem:realGet,setItem(k,v){fixture.writes.push({key:k,value:v});if(fixture.failSave)throw new DOMException('Anonymous fixture save refused','QuotaExceededError');realSet(k,v);},removeItem:realStore.removeItem.bind(realStore)};
   const deny=()=>{throw new Error('External capability prohibited in inert diagnostic');};
   const inertWindow={CITRONEX_SIMPLE_CONFIG:window.CITRONEX_SIMPLE_CONFIG,CITRONEX_SIMPLE_I18N:window.CITRONEX_SIMPLE_I18N,PRIMSERV_PDF_NAVIGATION:window.PRIMSERV_PDF_NAVIGATION,crypto:window.crypto,
    location:Object.freeze({href:window.location.href,assign(url){fixture.assigns.push({url,notice:document.getElementById('sendResult')?.textContent,disabled:document.querySelector('[data-action="send"]')?.disabled});if(test.throws)throw new DOMException('Anonymous fixture email handoff refused','SecurityError');}}),
    scrollTo:window.scrollTo.bind(window),addEventListener:window.addEventListener.bind(window),setTimeout(fn,ms){fixture.timers.push(ms);return window.setTimeout(fn,ms);},open:deny,fetch:deny};
   const log={warn(...args){fixture.warnings.push(args.map(String));}};
   new Function('window','navigator','localStorage','fetch','XMLHttpRequest','WebSocket','console',source)(inertWindow,{},storage,deny,deny,deny,log);
   return {inertDistinct:inertWindow!==window,locationDistinct:inertWindow.location!==window.location,noNativeAssignReference:true,emailOpened:window.CITRONEX_SIMPLE_I18N.locales.en.emailOpened,configuredLimit:window.CITRONEX_SIMPLE_CONFIG.maxMailtoLength,recruiterEmail:window.CITRONEX_SIMPLE_CONFIG.recruiters.find(x=>x.id==='yana').email};
  },{source:appSource,test,key});
  assert(dependency.inertDistinct&&dependency.locationDistinct&&dependency.noNativeAssignReference);
  await page.locator('[data-action="resume"]').click();await page.locator('[data-action="next"]').click();await page.locator('[data-action="send"]').waitFor();
  const old=await page.evaluate(key=>localStorage.getItem(key),key),review=await page.locator('.review-sections').innerText();
  await page.evaluate(test=>{window.__sendFixture.failSave=!!test.saveRefused;window.__sendFixture.writes=[];},test);
  await capture(page,width,test,'before','.send-box');
  await page.locator('[data-action="send"]').focus();await page.keyboard.press('Enter');
  await page.locator('#sendResult:not(.hidden)').waitFor();assert.equal(await page.locator('#sendResult').innerText(),dependency.emailOpened);
  assert(await page.locator('[data-action="send"]').isDisabled());
  await page.locator('[data-action="send"]').dispatchEvent('click');
  const initial=await page.evaluate(()=>structuredClone(window.__sendFixture));assert.equal(initial.assigns.length,1);assert.deepEqual(initial.timers,[2500]);assert.equal(initial.writes.length,1);
  const assigned=new URL(initial.assigns[0].url);assert.equal(assigned.protocol,'mailto:');assert.equal(decodeURIComponent(assigned.pathname),dependency.recruiterEmail);assert.deepEqual([...assigned.searchParams.keys()],['subject','body']);
  const subject=assigned.searchParams.get('subject'),body=assigned.searchParams.get('body'),lines=body.split('\n\n');assert(subject.includes('KAND-ANONYMOUS-SEND-FIXTURE')&&subject.includes('fixture / autumn / anonymous'));
  assert.equal(lines.length,2);const cells=lines[1].split('\t');assert.equal(cells.length,12);assert.equal(cells[2],'');assert.equal(cells[10],'');assert.equal(cells[11],'');assert(!cells.some(v=>/[\r\n]/.test(v)));
  if(test.unicode){assert(cells[0].includes('Анонімний & = +')&&cells[0].includes('Łódź? # %'));assert(!cells[1].includes('\t'));}
  const current=await page.evaluate(key=>localStorage.getItem(key),key);if(test.saveRefused)assert.equal(current,old);else assert.deepEqual(JSON.parse(current).data,JSON.parse(old).data);
  assert.equal(await page.locator('.review-sections').innerText(),review);
  await capture(page,width,test,'after','.send-box');
  await page.waitForFunction(()=>!document.querySelector('[data-action="send"]').disabled,null,{timeout:4000});
  assert.equal(await page.evaluate(()=>window.__sendFixture.assigns.length),1);
  const focusAfterRecovery=await page.evaluate(()=>({tag:document.activeElement.tagName,action:document.activeElement.dataset.action||null}));
  assert.equal(await page.evaluate(()=>localStorage.getItem('primserv-send-unrelated')),'KEEP');
  if(test.throws){assert.equal(errors.length,1);assert(errors[0].includes('Anonymous fixture email handoff refused'));report.observations.falseOpenedOnAssignThrow++;report.observations.unhandledAssignThrows++;}else assert.deepEqual(errors,[]);
  const over=initial.assigns[0].url.length>dependency.configuredLimit;if(over)report.observations.overConfiguredLength++;if(test.saveRefused)report.observations.saveRefusals++;
  report.rows.push({width,case:test.name,status:'passed-observation',dependency,anonymousMailto:initial.assigns[0].url,encodedLength:initial.assigns[0].url.length,overConfiguredLimit:over,cells:12,resultBeforeAssignment:initial.assigns[0].notice,assignThrow:!!test.throws,unhandledErrorCount:errors.length,buttonRecoversAfter2500:true,repeatedDispatchSuppressed:true,focusAfterRecovery,answersKept:true,failedSaveKeepsExactDraft:!!test.saveRefused,draftStatus:await page.locator('#draftStatus').getAttribute('data-state'),unrelatedPreserved:true,mailClientLaunches:0,deliveryAttempts:0});
 }catch(e){await page.screenshot({path:join(reportDir,`failure-send-${width}-${test.name}.png`)}).catch(()=>{});report.failedCase={width,case:test.name,errors};throw e;}finally{await ctx.close();}
}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();
 const matrix=[320,1280].flatMap(width=>modes.map(test=>({width,test})));let next=0;await Promise.all(Array.from({length:2},async()=>{while(next<matrix.length){const item=matrix[next++];await run(item.width,item.test);}}));
 assert.equal(report.rows.length,12);assert.equal(report.captures.length,24);assert.equal(report.observations.falseOpenedOnAssignThrow,4);assert.equal(report.observations.unhandledAssignThrows,4);assert.equal(report.observations.saveRefusals,4);assert.deepEqual(report.external,[]);assert.deepEqual(report.mutations,[]);report.mailClientLaunches=0;report.applicationDeliveryAttempts=0;report.status='PASSED_12_INERT_SEND_OBSERVATIONS_24_COMPONENTS';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
