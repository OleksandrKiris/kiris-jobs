// Runs only in the authorized isolated Actions fixture origin. No real submissions.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import vm from 'node:vm';
import {staticOrigin} from './static-origin.mjs';
import {inventory} from '../../scripts/build-pages-artifact.mjs';
import {applyLocales} from './apply-screening.mjs';
assert.equal(process.env.GITHUB_ACTIONS,'true','Use only the authorized Actions runner');
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PACKAGE);
const artifact=resolve(process.env.PAGES_ARTIFACT),arrival=resolve(process.env.ARRIVAL_SOURCE),reportDir=resolve(process.env.BROWSER_REPORT);
await mkdir(reportDir,{recursive:true});
const git=(...a)=>execFileSync('git',a),hash=b=>createHash('sha256').update(b).digest('hex');
const fixture=JSON.parse(await readFile(new URL('./fixtures/apply-arrival-handoff.json',import.meta.url),'utf8')),i18n=applyLocales();
assert.deepEqual(Object.keys(fixture.copy).sort(),Object.keys(i18n.languages).sort());
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:arrival}).toString().trim(),fixture.arrivalHead);
const sandbox={window:{},document:{addEventListener(){}},URLSearchParams};vm.createContext(sandbox);
for(const f of ['data/config.js','data/overrides.js','language-options.js'])vm.runInContext(await readFile(join(arrival,f),'utf8'),sandbox);
const arrivalConfig=JSON.parse(JSON.stringify(sandbox.window.ARRIVAL_DEFAULT_CONFIG));
assert.deepEqual(arrivalConfig.languages,fixture.languages);assert.deepEqual(Object.fromEntries(Object.entries(arrivalConfig.locations).map(([k,v])=>[k,v.name])),fixture.locations);
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout:git('rev-parse','HEAD').toString().trim(),arrivalHead:fixture.arrivalHead,started:new Date().toISOString(),files:{},arrivalFiles:{},rows:[],captures:[],mutations:[],external:[],limits:['Chromium320/1280 on isolated fixtures; no physical-device or native-speaker certification.','Destination is the exact published Arrival source served only through intercepted requests. No real external delivery.','Network failure preserves the open application. First-use offline availability of the guide is not promised or certified.']};
assert.deepEqual(git('show','-s','--format=%P','HEAD').toString().trim().split(' '),[report.base,report.head]);
assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),git('rev-parse',report.head+'^{tree}').toString().trim());
for(const {path:p}of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,bytes=await readFile(join(artifact,p));assert.deepEqual(bytes,git('show',`${report.head}:${source}`));report.files[p]={source,bytes:bytes.length,sha256:hash(bytes)};
}
assert.equal(Object.keys(report.files).length,317);
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-handoff-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');
const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/',destination='https://oleksandrkiris.github.io/przyjazd-do-pracy/';let browser;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
async function draft(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('citronex_screening_application_v17')));}
async function shot(page,name){
 await page.evaluate(async()=>{await document.fonts.ready;document.querySelector('.arrival-preparation').scrollIntoView({block:'center',behavior:'instant'});delete window.__handoffStable;});
 await page.waitForFunction(()=>{const r=document.querySelector('.arrival-preparation').getBoundingClientRect(),key=[scrollY,r.x,r.y,r.width,r.height].join(':');if(window.__handoffStable?.key!==key)window.__handoffStable={key,since:performance.now()};return performance.now()-window.__handoffStable.since>180;},{},{polling:'raf'});
 const card=page.locator('.arrival-preparation'),before=await card.boundingBox();await card.screenshot({path:join(reportDir,name+'.png')});const after=await card.boundingBox();assert(Object.keys(before).every(k=>Math.abs(before[k]-after[k])<0.1));
 const visible=await card.evaluate(n=>{const box=n.getBoundingClientRect();return {texts:[...n.querySelectorAll('h2,p,label,a,button')].filter(x=>x.checkVisibility()).map(x=>({text:x.innerText,fit:x.scrollWidth<=x.clientWidth+1,painted:x.checkVisibility()})),fit:document.documentElement.scrollWidth<=innerWidth+1&&box.left>=0&&box.right<=innerWidth+1};});assert(visible.fit&&visible.texts.every(x=>x.fit&&x.painted));report.captures.push({file:name+'.png',before,after,stable:true,...visible});
}
async function fillToReview(page,lang,location){
 await page.goto(base+'apply/?src=QA-FIXTURE&campaign=NEVER-EXPORT');await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();await page.locator('[data-recruiter="yana"]').click();
 for(const [id,value]of Object.entries({firstName:'QA',lastName:'FIXTURE',phone:'+99912345678',citizenship:'FIXTURE',age:'30'}))await page.locator('#'+id).fill(value);
 await page.locator('#messenger').selectOption('telegram');await page.locator('[name="gender"][value="undisclosed"]').locator('..').click();await page.locator('[data-action="next"]').click();
 await page.locator('#location').selectOption(location);await page.locator('#stayDuration').selectOption('six');await page.locator('[name="physicalWork"][value="no"]').locator('..').click();await page.locator('[data-action="next"]').click();
 for(const id of ['performanceMetrics','fastPace','watchedVideos','understandsRole','longHours'])await page.locator(`[name="${id}"][value="no"]`).locator('..').click();await page.locator('#consent').check();await page.locator('[data-action="next"]').click();await page.locator('#arrivalTitle').waitFor();
}
async function run({lang,width,index}){
 const ctx=await browser.newContext({viewport:{width,height:1100},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];let unavailable=false,failedNavigations=0;ctx.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));
 await ctx.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());
  if(!['GET','HEAD'].includes(request.method())){report.mutations.push({url:request.url(),method:request.method()});return route.abort('blockedbyclient');}
  if(request.url().startsWith(base))return route.continue();
  if(request.url().startsWith(destination)){
   if(unavailable){if(request.isNavigationRequest())failedNavigations++;return route.abort('internetdisconnected');}
   const p=decodeURIComponent(url.pathname.slice(new URL(destination).pathname.length))||'index.html';assert(!p.includes('..')&&!p.startsWith('/'));
   const bytes=await readFile(join(arrival,p));assert.deepEqual(bytes,execFileSync('git',['show',fixture.arrivalHead+':'+p],{cwd:arrival}));report.arrivalFiles[p]={bytes:bytes.length,sha256:hash(bytes)};
   if(request.isNavigationRequest())assert(!request.headers()['referer'],'No application URL in destination referrer');
   return route.fulfill({status:200,contentType:mime[extname(p)]||'application/octet-stream',body:bytes});
  }
  report.external.push(request.url());return route.abort('blockedbyclient');
 });
 try{
  const rootLocation=['siechnice','ryczywol','bogatynia','any'][index%4],supported=Object.hasOwn(fixture.languages,lang),copy=fixture.copy[lang];await fillToReview(page,lang,rootLocation);
  assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.locator('html').getAttribute('dir'),i18n.languages[lang].direction);const before=await draft(page),review=await page.locator('.review-sections').innerText(),rootUrl=page.url();
  assert.equal(await page.locator('#arrivalTitle').innerText(),copy[0]);assert.equal(await page.locator('.arrival-preparation>p').first().innerText(),copy[1]);assert.deepEqual(await page.locator('.arrival-preparation label').allTextContents(),[copy[2],copy[3]]);assert.equal(await page.locator('#arrivalNote').innerText(),copy[7]);
  assert.deepEqual(await page.locator('#arrivalLanguage option').evaluateAll(ns=>ns.map(n=>[n.value,n.textContent])),[['',copy[4]],...Object.entries(fixture.languages)]);
  assert.deepEqual(await page.locator('#arrivalLocation option').evaluateAll(ns=>ns.map(n=>[n.value,n.textContent])),[['',copy[4]],...Object.entries(fixture.locations)]);
  assert.equal(await page.locator('#arrivalLanguage').inputValue(),supported?lang:'');assert.equal(await page.locator('#arrivalLocation').inputValue(),rootLocation==='any'?'':rootLocation);
  assert.equal(await page.locator('#arrivalUnavailable').count(),supported?0:1);if(!supported)assert.equal(await page.locator('#arrivalUnavailable').innerText(),copy[6]);
  if(!supported||rootLocation==='any'){assert.equal(await page.locator('#arrivalOpen').getAttribute('href'),null);assert(await page.locator('#arrivalPending').isDisabled());assert(!await page.locator('#arrivalOpen').isVisible());}
  await page.locator('#arrivalLanguage').focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await page.waitForFunction(()=>getComputedStyle(document.activeElement).outlineWidth==='3px');await shot(page,`handoff-${width}-${lang}-initial`);
  // Native keyboard selection and actual Tab navigation are used before choosing the matrix destination.
  await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#arrivalLanguage').inputValue(),'pl');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'arrivalLocation');
  const guideLang=Object.keys(fixture.languages)[index%9],guideLocation=Object.keys(fixture.locations)[index%4];await page.locator('#arrivalLanguage').selectOption(guideLang);await page.locator('#arrivalLocation').selectOption(guideLocation);
  await page.locator('#arrivalLocation').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'arrivalOpen');await page.waitForFunction(()=>getComputedStyle(document.activeElement).outlineWidth==='3px');
  const link=page.locator('#arrivalOpen'),url=new URL(await link.getAttribute('href'));assert.equal(url.origin+url.pathname,destination);assert.deepEqual([...url.searchParams],[['lang',guideLang],['location',guideLocation],['pack','choose']]);assert.equal(url.hash,'');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');assert.equal(await link.getAttribute('referrerpolicy'),'no-referrer');assert.equal(await link.innerText(),copy[5]+' ↗');await shot(page,`handoff-${width}-${lang}-ready`);assert.deepEqual(await draft(page),before);
  const popupReady=page.waitForEvent('popup');await page.keyboard.press('Enter');const popup=await popupReady;await popup.locator('#packingChoice').waitFor();assert.equal(popup.url(),url.href);assert.equal(await popup.evaluate(()=>window.opener===null),true);assert.equal(await popup.locator('html').getAttribute('lang'),guideLang);assert.equal(await popup.locator('#locationName').innerText(),fixture.locations[guideLocation]);assert.equal(await popup.locator('#packingChoice').inputValue(),'');assert.equal(await popup.locator('.packing-panel input[type="checkbox"]').count(),0);assert.equal(await popup.locator('#employeeName').innerText(),'-');assert.equal(await popup.locator('#arrivalDate').innerText(),'-');await popup.close();
  assert.equal(page.url(),rootUrl);assert.equal(await page.locator('.review-sections').innerText(),review);assert.deepEqual(await draft(page),before);
  unavailable=true;const failureReady=page.waitForEvent('popup');await link.focus();await page.keyboard.press('Enter');const failed=await failureReady;await failed.waitForLoadState().catch(()=>{});assert.equal(failedNavigations,1);await failed.close();assert.equal(page.url(),rootUrl);assert.deepEqual(await draft(page),before);assert.equal(await page.locator('.review-sections').innerText(),review);
  // Unknown/prototype/injected values cannot produce an outbound URL, even if an option is tampered with.
  for(const id of ['arrivalLanguage','arrivalLocation']){const old=await page.locator('#'+id).inputValue();await page.locator('#'+id).evaluate(n=>{n.add(new Option('invalid','__proto__'));n.value='__proto__';n.dispatchEvent(new Event('change'));});assert.equal(await link.getAttribute('href'),null);assert(!await link.isVisible());await page.locator('#'+id).selectOption(old);}
  await page.locator('[data-action="edit"]').click();await page.locator('[data-action="back"]').click();assert.equal(await page.locator('#location').inputValue(),rootLocation);await page.locator('[data-action="back"]').click();assert.equal(await page.locator('#firstName').inputValue(),'QA');assert.equal(await page.locator('#lastName').inputValue(),'FIXTURE');assert.equal(await page.locator('#citizenship').inputValue(),'FIXTURE');
  await page.reload();await page.locator('[data-action="resume"]').click();assert.equal(await page.locator('#phone').inputValue(),'+99912345678');assert.equal(await page.locator('#firstName').inputValue(),'QA');assert.equal(await page.locator('html').getAttribute('lang'),lang);
  assert.deepEqual(errors,[]);report.rows.push({lang,width,rootLocation,supported,guideLang,guideLocation,status:'passed',copy:true,explicitFallback:!supported,explicitAny:rootLocation==='any',nativeKeyboard:true,visibleFocus:true,exactPublicDestination:true,onlyThreeEnumParameters:true,noReferrer:true,noOpener:true,realDestinationRendered:true,explicitPacking:true,noPersonalDestinationFields:true,networkFailurePreservesReview:true,answersUnchanged:true,editBack:true,resumed:true,noDelivery:true});
 }catch(e){await page.screenshot({path:join(reportDir,`failure-${width}-${lang}.png`)}).catch(()=>{});throw e;}finally{await ctx.close();}
}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();const cases=[320,1280].flatMap(width=>Object.keys(fixture.copy).map((lang,index)=>({lang,index,width})));let next=0;await Promise.all(Array.from({length:2},async()=>{while(next<cases.length)await run(cases[next++]);}));assert.equal(report.rows.length,40);assert.equal(report.captures.length,80);assert.equal(report.rows.filter(r=>r.explicitFallback).length,24);assert.equal(report.rows.filter(r=>r.explicitAny).length,10);assert.equal(new Set(report.rows.map(r=>r.guideLang)).size,9);assert.equal(new Set(report.rows.map(r=>r.guideLocation)).size,4);assert.deepEqual(report.mutations,[]);report.applicationDeliveryAttempts=0;report.status='PASSED_40_REAL_REVIEW_TO_ARRIVAL_HANDOFF_FLOWS';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
