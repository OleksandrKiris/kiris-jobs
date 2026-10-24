// Anonymous Actions-only fixtures. All external requests and mutations are blocked.
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
const fixture=JSON.parse(await readFile(new URL('./fixtures/short-apply-phone.json',import.meta.url),'utf8')),labels=fixture.labels;assert.equal(Object.keys(labels).length,20);
const diagnostic=process.env.GITHUB_EVENT_NAME==='push';
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout:git('rev-parse','HEAD').toString().trim(),diagnostic,started:new Date().toISOString(),files:{},rows:[],mutations:[],external:[],limits:['Desktop Chromium at320/1280; no physical-device or native-speaker certification.','Phone-only error/correction in the current short form. No final delivery, other business rules or complete seven-site acceptance.','Fresh isolated contexts with service workers blocked; no new offline acceptance claim.']};
if(diagnostic){assert.equal(report.checkout,report.head);assert.equal(git('rev-parse','HEAD^').toString().trim(),report.base);}else{assert.deepEqual(git('show','-s','--format=%P','HEAD').toString().trim().split(' '),[report.base,report.head]);assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),git('rev-parse',report.head+'^{tree}').toString().trim());}
for(const {path:p}of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,bytes=await readFile(join(artifact,p));assert.deepEqual(bytes,git('show',`${report.head}:${source}`),p);
 if(diagnostic)assert.deepEqual(bytes,git('show',`${report.base}:${source}`),`Diagnostic public bytes must be unchanged: ${p}`);
 report.files[p]={source,bytes:bytes.length,sha256:sha(bytes)};
}
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-phone-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');
const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';let browser;
async function language(page,lang){
 await page.locator('[data-action="language"]').click();await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();await page.locator('[data-recruiter="yana"]').click();await page.locator('#candidateForm').waitFor();assert.equal(await page.locator('html').getAttribute('lang'),lang);
}
async function values(page){return page.evaluate(()=>({...Object.fromEntries(['firstName','lastName','phone','citizenship','age','messenger'].map(k=>[k,document.getElementById(k).value])),gender:document.querySelector('[name="gender"]:checked')?.value}));}
async function invalid(page,lang){
 await page.locator('[data-action="next"]').click();await page.waitForFunction(()=>document.activeElement?.id==='phone');assert.equal(await page.locator('.field-error').count(),1);assert.equal(await page.locator('#phone-error').innerText(),labels[lang]);
 assert.equal(await page.locator('#phone').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('#phone').getAttribute('aria-describedby'),'phone-error');assert.equal(await page.locator('[aria-invalid="true"]').count(),1);
}
async function run({width,lang}){
 const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);
 await ctx.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({method:q.method(),path:u.pathname,blocked:true});return r.abort();}if(u.origin!==new URL(base).origin){report.external.push({host:u.hostname,path:u.pathname,blocked:true});return r.abort();}return r.continue();});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'apply/');await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();await page.locator('[data-recruiter="yana"]').click();await page.locator('#candidateForm').waitFor();
  for(const[id,value]of [['firstName','QA'],['lastName','FIXTURE'],['phone','+123'],['citizenship','FIXTURE'],['age','30']])await page.locator('#'+id).fill(value);
  await page.locator('#messenger').selectOption('telegram');await page.locator('[name="gender"][value="undisclosed"]').locator('..').click();const before=await values(page);await invalid(page,lang);
  const away=lang==='en'?'ru':'en';await language(page,away);assert.deepEqual(await values(page),before);assert.equal(await page.locator('.field-error').count(),0,'Language selection intentionally resets previous validation');await invalid(page,away);
  await language(page,lang);assert.deepEqual(await values(page),before);await invalid(page,lang);await page.evaluate(()=>document.fonts.ready);
  const dom=await page.locator('#phone-error').evaluate(error=>{
   const input=document.getElementById('phone'),field=input.closest('.field'),box=error.getBoundingClientRect(),s=getComputedStyle(error),fieldBox=field.getBoundingClientRect();
   const clone=error.cloneNode(true);clone.style.cssText=`position:fixed;left:-10000px;top:0;visibility:hidden;display:block;width:${box.width}px;height:auto;max-height:none;overflow:visible;-webkit-line-clamp:unset;line-clamp:unset;font:${s.font};letter-spacing:${s.letterSpacing};white-space:${s.whiteSpace};box-sizing:${s.boxSizing};`;document.body.append(clone);const natural=clone.getBoundingClientRect().height;clone.remove();
   return {actualLang:document.documentElement.lang,label:field.querySelector('label').textContent,hint:field.querySelector('.field-hint')?.textContent,error:error.textContent,phone:input.value,phoneLTR:getComputedStyle(input).direction==='ltr',focused:document.activeElement===input,associated:input.getAttribute('aria-describedby')===error.id&&input.getAttribute('aria-invalid')==='true',painted:error.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&fieldBox.width>0,fit:document.documentElement.scrollWidth<=innerWidth+1&&fieldBox.left>=-1&&fieldBox.right<=innerWidth+1&&box.height>=natural-1&&error.scrollWidth<=error.clientWidth+1,step:document.querySelector('.progress-meta strong').textContent.trim()};
  });
  for(const k of ['phoneLTR','focused','associated','painted','fit'])assert.equal(dom[k],true,`${width}:${lang}:${k}`);assert.equal(dom.actualLang,lang);assert.equal(dom.step,'1 / 3');assert.equal(dom.error,labels[lang]);
  await page.locator('#phone').locator('..').screenshot({path:join(reportDir,`phone-${width}-${lang}-field.png`)});await page.screenshot({path:join(reportDir,`phone-${width}-${lang}-viewport.png`)});
  await page.locator('#phone').fill('+99912345678');const cleared=await page.locator('#phone-error').count()===0&&await page.locator('#phone').getAttribute('aria-invalid')===null;assert.equal(cleared,true);
  await page.locator('[data-action="next"]').click();await page.locator('#location').waitFor();assert.equal(await page.locator('.progress-meta strong').innerText(),'2 / 3');assert.equal(await page.locator('[data-action="send"]').count(),0);
  await page.locator('[data-action="back"]').click();await page.locator('#phone').waitFor();assert.deepEqual(await values(page),{...before,phone:'+99912345678'});
  assert.deepEqual(errors,[]);report.rows.push({width,lang,status:'passed',...dom,onlyPhoneInvalid:true,answersPreserved:true,languageRoundTrip:true,previousErrorResetThenRevalidated:true,clearedOnEdit:cleared,correctedAdvancesToStep2:true,backPreserved:true,noDelivery:true});
 }catch(e){await page.screenshot({path:join(reportDir,`failure-${width}-${lang}.png`)}).catch(()=>{});throw e;}finally{await ctx.close();}
}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();const cases=[320,1280].flatMap(width=>Object.keys(labels).map(lang=>({width,lang})));let next=0;await Promise.all(Array.from({length:2},async()=>{while(next<cases.length)await run(cases[next++]);}));
 assert.equal(report.rows.length,40);assert(report.mutations.every(r=>r.blocked&&r.method==='POST'&&r.path==='/api/public/funnel'));report.applicationDeliveryAttempts=0;report.status='PASSED_40_SHORT_FORM_PHONE_ONLY_ERRORS_LANGUAGE_ROUND_TRIP_AND_CORRECTION';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
