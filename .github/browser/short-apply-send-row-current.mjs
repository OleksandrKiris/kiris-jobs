// Exact application bytes, real Chromium DOM, inert mailto dependency only.
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
const artifact=resolve(process.env.PAGES_ARTIFACT),reportDir=resolve(process.env.BROWSER_REPORT);await mkdir(reportDir,{recursive:true});
const appSource=await readFile(join(artifact,'apply/app.js'),'utf8');
const messages=JSON.parse(await readFile(new URL('./fixtures/short-apply-send-row.json',import.meta.url),'utf8'));assert.equal(Object.keys(messages).length,20);
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout:git('rev-parse','HEAD').toString().trim(),applicationSourceSha256:sha(appSource),files:{},flows:[],rows:[],captures:[],external:[],mutations:[],limits:[
 'Twenty form languages at320/1280. Inert window dependency with real Chromium DOM/styles; no native mail-client/device/offline/screen-reader/native-speaker certification.',
 'The normal app.js request is an empty fixture response. Its exact staged bytes are then executed unchanged with a separate window.location.assign dependency that records or throws. Executed source bytes are not rewritten.',
 'A captured assign returning normally proves the generated anonymous URL only. It never proves that a mail application opened or a message was sent.',
 'Assign/storage exceptions are synthetic fixture failures. No external request, real clipboard, accounts, candidate data or application delivery.'
]};
assert.deepEqual(git('show','-s','--format=%P','HEAD').toString().trim().split(' '),[report.base,report.head]);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),git('rev-parse',report.head+'^{tree}').toString().trim());
assert.deepEqual(Buffer.from(appSource),git('show',`${report.head}:apply/app.js`));
for(const {path:p}of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,b=await readFile(join(artifact,p));assert.deepEqual(b,git('show',`${report.head}:${source}`));report.files[p]={source,bytes:b.length,sha256:sha(b),publishedExact:b.equals(git('show',`${report.base}:${source}`))};
}assert.equal(Object.keys(report.files).length,317);
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-send-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';let browser;
const key='citronex_screening_application_v17';
const modes=[{name:'capture'},{name:'assign-throw',throws:true},{name:'save-refused-assign-throw',saveRefused:true,throws:true}];
async function context(width,lang,test){
 const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);let suppressed=0;
 await ctx.route('**/*',route=>{const q=route.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({lang,width,case:test.name,method:q.method(),path:u.pathname,blocked:true});return route.abort();}if(u.origin!==new URL(base).origin){report.external.push({lang,width,case:test.name,host:u.hostname,path:u.pathname,blocked:true});return route.abort();}if(u.pathname==='/kiris-jobs/apply/app.js'){suppressed++;return route.fulfill({status:200,contentType:'text/javascript',body:'/* Inert window dependency: source executed separately. */'});}return route.continue();});
 await ctx.addInitScript(({key,lang})=>{
  const data={firstName:'ANONYMOUS',lastName:'FIXTURE',phone:'+99912345678',messenger:'telegram',citizenship:'FIXTURE',gender:'undisclosed',age:'30',location:'any',stayDuration:'six',physicalWork:'no',physicalDetails:'',performanceMetrics:'no',fastPace:'no',watchedVideos:'no',understandsRole:'no',longHours:'no',consent:true};
  localStorage.setItem(key,JSON.stringify({version:'17.0.0',id:'KAND-ANONYMOUS-SEND-FIXTURE',routeKey:'yana|any|fixture|autumn|anonymous',language:lang,recruiterId:'yana',step:3,data,savedAt:Date.now()}));localStorage.setItem('primserv-send-unrelated','KEEP');window.__sendFixture={assigns:[],timers:[],writes:[],warnings:[]};
 },{key,lang});return {ctx,suppressed:()=>suppressed};
}
async function capture(page,width,lang,test){
 await page.evaluate(()=>document.fonts.ready);await page.locator('.send-box').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(100);
 const dom=await page.locator('.send-box').evaluate(n=>{const box=n.getBoundingClientRect(),result=document.getElementById('sendResult'),r=result.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(result);return {text:n.innerText,result:result.innerText,visible:n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),fit:document.documentElement.scrollWidth<=innerWidth+1&&n.scrollWidth<=n.clientWidth+1&&[...range.getClientRects()].every(b=>b.left>=r.left-1&&b.right<=r.right+1),lang:document.documentElement.lang,direction:document.documentElement.dir,rect:{x:box.x,y:box.y,width:box.width,height:box.height}};});assert(dom.visible&&dom.fit&&dom.lang===lang);assert.equal(dom.result,messages[lang]);
 const file=`send-${width}-${lang}-${test.name}.png`;await page.locator('.send-box').screenshot({path:join(reportDir,file)});const b=await readFile(join(reportDir,file));report.captures.push({file,width,lang,case:test.name,sha256:sha(b),dom,originalComponent:true});return sha(b);
}
async function part(width,lang,test){
 const {ctx,suppressed}=await context(width,lang,test),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+`apply/?lang=${lang}&recruiter=yana&location=any&src=fixture&campaign=autumn&vacancy=anonymous`);assert.equal(suppressed(),1);assert.equal(await page.locator('#languageSearch').count(),0,'Native app must not execute');
  const dependency=await page.evaluate(({source,test,key})=>{
   const fixture=window.__sendFixture,realStore=window.localStorage,realSet=realStore.setItem.bind(realStore),realGet=realStore.getItem.bind(realStore),deny=()=>{throw new Error('External capability prohibited in inert diagnostic');};
   const storage={getItem:realGet,setItem(k,v){fixture.writes.push({key:k,value:v});if(fixture.failSave)throw new DOMException('Anonymous fixture save refused','QuotaExceededError');realSet(k,v);},removeItem:realStore.removeItem.bind(realStore)};
   const inertWindow={CITRONEX_SIMPLE_CONFIG:window.CITRONEX_SIMPLE_CONFIG,CITRONEX_SIMPLE_I18N:window.CITRONEX_SIMPLE_I18N,PRIMSERV_PDF_NAVIGATION:window.PRIMSERV_PDF_NAVIGATION,crypto:window.crypto,
    location:Object.freeze({href:window.location.href,assign(url){fixture.assigns.push({url,notice:document.getElementById('sendResult')?.textContent,disabled:document.querySelector('[data-action="send"]')?.disabled});if(test.throws)throw new DOMException('Anonymous fixture email handoff refused','SecurityError');}}),
    scrollTo:window.scrollTo.bind(window),addEventListener:window.addEventListener.bind(window),setTimeout(fn,ms){fixture.timers.push(ms);return window.setTimeout(fn,ms);},open:deny,fetch:deny};
   const log={warn(...args){fixture.warnings.push(args.map(String));}};
   new Function('window','navigator','localStorage','fetch','XMLHttpRequest','WebSocket','console',source)(inertWindow,{},storage,deny,deny,deny,log);
   return {inertDistinct:inertWindow!==window,locationDistinct:inertWindow.location!==window.location,noNativeAssignReference:true,recruiterEmail:window.CITRONEX_SIMPLE_CONFIG.recruiters.find(x=>x.id==='yana').email};
  },{source:appSource,test,key});assert(dependency.inertDistinct&&dependency.locationDistinct&&dependency.noNativeAssignReference);
  await page.locator('[data-action="resume"]').click();await page.locator('[data-action="next"]').click();await page.locator('[data-action="send"]').waitFor();
  const old=await page.evaluate(key=>localStorage.getItem(key),key),review=await page.locator('.review-sections').innerText();await page.evaluate(test=>{window.__sendFixture.failSave=!!test.saveRefused;window.__sendFixture.writes=[];},test);
  await page.locator('[data-action="send"]').focus();await page.keyboard.press('Enter');await page.locator('#sendResult:not(.hidden)').waitFor();assert.equal(await page.locator('#sendResult').innerText(),messages[lang]);assert(await page.locator('[data-action="send"]').isDisabled());
  await page.locator('[data-action="send"]').dispatchEvent('click');const initial=await page.evaluate(()=>structuredClone(window.__sendFixture));assert.equal(initial.assigns.length,1);assert.deepEqual(initial.timers,[2500]);assert.equal(initial.writes.length,1);assert.equal(initial.assigns[0].notice,messages[lang]);assert(initial.assigns[0].disabled);
  const assigned=new URL(initial.assigns[0].url);assert.equal(assigned.protocol,'mailto:');assert.equal(decodeURIComponent(assigned.pathname),dependency.recruiterEmail);assert.deepEqual([...assigned.searchParams.keys()],['subject','body']);
  const subject=assigned.searchParams.get('subject'),body=assigned.searchParams.get('body'),separator=body.lastIndexOf('\n\n');assert(subject.includes('KAND-ANONYMOUS-SEND-FIXTURE')&&subject.includes('fixture / autumn / anonymous'));assert(separator>0);
  const cells=body.slice(separator+2).split('\t');assert.deepEqual(cells,['FIXTURE ANONYMOUS | +99912345678 | Telegram','FIXTURE','','30','DO USTALENIA','6 MSC','NIE','WSKAŹNIKI: NIE; SZYBKIE TEMPO: NIE','FILMY: NIE; WARUNKI PRACY: NIE','NIE','','']);assert(!cells.some(v=>/[\r\n]/.test(v)));
  const current=await page.evaluate(key=>localStorage.getItem(key),key);if(test.saveRefused)assert.equal(current,old);else assert.deepEqual(JSON.parse(current).data,JSON.parse(old).data);assert.equal(await page.locator('.review-sections').innerText(),review);
  const screenshot=await capture(page,width,lang,test);await page.waitForFunction(()=>!document.querySelector('[data-action="send"]').disabled,null,{timeout:4000});assert.equal(await page.evaluate(()=>window.__sendFixture.assigns.length),1);assert.equal(await page.evaluate(()=>localStorage.getItem('primserv-send-unrelated')),'KEEP');assert.deepEqual(errors,[]);
  assert.equal(initial.warnings.length,Number(!!test.saveRefused)+Number(!!test.throws));if(test.throws)assert(initial.warnings.some(row=>row.length===1&&row[0]==='Email application could not be opened.'));assert(!initial.warnings.flat().some(v=>v.includes('mailto:')||v.includes('KAND-ANONYMOUS-SEND-FIXTURE')));
  const result={width,lang,case:test.name,status:'passed',dependency,encodedLength:initial.assigns[0].url.length,cells:12,conditionalMessage:true,nativeKeyboard:true,noUnhandledError:true,buttonRecoversAfter2500:true,repeatedDispatchSuppressed:true,answersKept:true,failedSaveKeepsExactDraft:!!test.saveRefused,draftStatus:await page.locator('#draftStatus').getAttribute('data-state'),unrelatedPreserved:true,screenshot,mailClientLaunches:0,deliveryAttempts:0};report.rows.push(result);return result;
 }catch(e){await page.screenshot({path:join(reportDir,`failure-send-${width}-${lang}-${test.name}.png`)}).catch(()=>{});report.failedCase??={width,lang,case:test.name,errors,failure:e.message};throw e;}finally{await ctx.close();}
}
async function flow(width,lang){const cases=[];for(const test of modes)cases.push(await part(width,lang,test));report.flows.push({width,lang,cases:cases.map(c=>c.case),status:'passed',noDelivery:true});}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();const matrix=[320,1280].flatMap(width=>Object.keys(messages).map(lang=>({width,lang})));let next=0;await Promise.all(Array.from({length:2},async()=>{while(next<matrix.length){const item=matrix[next++];await flow(item.width,item.lang);}}));
 assert.equal(report.flows.length,40);assert.equal(report.rows.length,120);assert.equal(report.captures.length,120);assert.deepEqual(report.external,[]);assert.deepEqual(report.mutations,[]);report.mailClientLaunches=0;report.applicationDeliveryAttempts=0;report.status='PASSED_40_FLOWS_20_LANGUAGES_120_INERT_SEND_CASES_AND_COMPONENTS';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
