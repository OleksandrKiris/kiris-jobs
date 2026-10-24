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
const fixture=JSON.parse(await readFile(new URL('./fixtures/short-apply-required.json',import.meta.url),'utf8')),labels=fixture.labels;assert.equal(Object.keys(labels).length,20);
const diagnostic=process.env.GITHUB_EVENT_NAME==='push',fields=process.env.CASE_SCOPE?[process.env.CASE_SCOPE]:['messenger','gender'];assert(fields.every(f=>['messenger','gender'].includes(f)));if(!diagnostic)assert.deepEqual(fields,['messenger','gender'],'PR must run both complete required-field scopes');
const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,publishedMain:diagnostic?fixture.publishedMain:process.env.TESTED_BASE,checkout:git('rev-parse','HEAD').toString().trim(),diagnostic,fields,started:new Date().toISOString(),files:{},rows:[],captureGeometry:[],observations:[],mutations:[],external:[],limits:['Desktop Chromium at320/1280; no physical-device or native-speaker certification.','Isolated messenger-select and gender-radio errors/correction only. No final delivery, native option-popup or complete seven-site acceptance.','Fresh isolated contexts with service workers blocked; no new offline acceptance claim.','Diagnostic published bytes are checked separately; PR staged bytes must match the exact event head and its event-base comparison is recorded.']};
if(diagnostic){assert.equal(report.checkout,report.head);assert.equal(git('rev-parse','HEAD^').toString().trim(),report.base);}else{assert.deepEqual(git('show','-s','--format=%P','HEAD').toString().trim().split(' '),[report.base,report.head]);assert.equal(git('rev-parse','HEAD^{tree}').toString().trim(),git('rev-parse',report.head+'^{tree}').toString().trim());assert.equal(report.base,report.publishedMain);}
for(const {path:p}of inventory(artifact)){
 const source=p.startsWith('tools/coordinator/')?'coordinator-demo/'+p.split('/').at(-1):p,bytes=await readFile(join(artifact,p));assert.deepEqual(bytes,git('show',`${report.head}:${source}`),p);
 if(diagnostic)assert.deepEqual(bytes,git('show',`${report.base}:${source}`),`Diagnostic public bytes must equal prior WIP: ${p}`);
 const publishedExact=bytes.equals(git('show',`${report.publishedMain}:${source}`));if(diagnostic)assert.equal(publishedExact,p!=='docs/primserv-roadmap.md',`Only unmerged roadmap may differ from published main: ${p}`);report.files[p]={source,bytes:bytes.length,sha256:sha(bytes),publishedExact};
}
assert.equal(Object.keys(report.files).length,317);if(diagnostic)assert.equal(Object.values(report.files).filter(f=>f.publishedExact).length,316);
const serveRoot=await mkdtemp(join(tmpdir(),'primserv-required-'));await symlink(artifact,join(serveRoot,'kiris-jobs'),'dir');
const origin=staticOrigin(serveRoot),base='http://127.0.0.1:4173/kiris-jobs/';let browser;
const controls=(page,field)=>page.locator(`[data-field="${field}"]`);
async function language(page,lang){await page.locator('[data-action="language"]').click();await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();await page.locator('[data-recruiter="yana"]').click();await page.locator('#candidateForm').waitFor();assert.equal(await page.locator('html').getAttribute('lang'),lang);}
async function values(page){return page.evaluate(()=>({...Object.fromEntries(['firstName','lastName','phone','citizenship','age','messenger'].map(k=>[k,document.getElementById(k).value])),gender:document.querySelector('[name="gender"]:checked')?.value||''}));}
async function invalid(page,lang,field){
 await page.locator('[data-action="next"]').click();await page.waitForFunction(f=>document.activeElement?.dataset.field===f,field);assert.equal(await page.locator('.field-error').count(),1);assert.equal(await page.locator(`#${field}-error`).innerText(),labels[lang]);
 const expected=field==='gender'?3:1;assert.equal(await controls(page,field).count(),expected);assert.equal(await page.locator('[aria-invalid="true"]').count(),expected);
 assert.equal(await controls(page,field).evaluateAll((nodes,f)=>nodes.every(n=>n.getAttribute('aria-invalid')==='true'&&n.getAttribute('aria-describedby')===`${f}-error`),field),true);if(field==='gender')assert.equal(await page.evaluate(()=>document.activeElement.value),'female');
}
async function fieldShot(page,field,file){
 if(field==='messenger')return page.locator('#messenger').locator('..').screenshot({path:file});
 const measure=()=>controls(page,field).first().evaluate(n=>{const r=n.closest('.field').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollX,scrollY};});
 for(let attempt=1;attempt<=3;attempt++){
  await controls(page,field).first().evaluate(n=>{n.closest('.field').scrollIntoView({block:'center',behavior:'instant'});delete window.__primservCapture;});
  await page.waitForFunction(f=>{const r=document.querySelector(`[data-field="${f}"]`).closest('.field').getBoundingClientRect(),key=[scrollX,scrollY,r.x,r.y,r.width,r.height].map(v=>Math.round(v*100)/100).join(':');if(window.__primservCapture?.key!==key)window.__primservCapture={key,since:performance.now()};return performance.now()-window.__primservCapture.since>=180;},field,{polling:'raf',timeout:2500});
  const before=await measure(),viewport=page.viewportSize(),x=Math.max(0,Math.floor(before.x)-6),y=Math.max(0,Math.floor(before.y)-6),right=Math.min(viewport.width,Math.ceil(before.x+before.width)+6),bottom=Math.min(viewport.height,Math.ceil(before.y+before.height)+6);assert(x<=before.x-5&&y<=before.y-5&&right>=before.x+before.width+5&&bottom>=before.y+before.height+5,'Entire field plus focus outline must fit the screenshot');
  const bytes=await page.screenshot({clip:{x,y,width:right-x,height:bottom-y}}),after=await measure(),stable=Object.keys(before).every(k=>Math.abs(before[k]-after[k])<0.1);report.captureGeometry.push({file:file.split('/').at(-1),field,attempt,before,after,clip:{x,y,width:right-x,height:bottom-y},stable});
  if(stable){await writeFile(file,bytes);return;}
  await writeFile(file.replace(/\.png$/,`.unstable-${attempt}.png`),bytes);
 }
 throw new Error('Field moved during all bounded screenshot attempts: '+file);
}
async function visibleRadioFocus(page,value){
 const actual=await page.evaluate(()=>{const n=document.activeElement,c=n.closest('.choice-card'),s=c&&getComputedStyle(c);return {field:n.dataset.field,value:n.value,outlineStyle:s?.outlineStyle,outlineWidth:s?.outlineWidth,outlineColor:s?.outlineColor,outlineOffset:s?.outlineOffset};});assert.equal(actual.field,'gender');assert.equal(actual.value,value);assert.equal(actual.outlineStyle,'solid');assert.equal(actual.outlineWidth,'3px');assert.equal(actual.outlineOffset,'2px');assert.notEqual(actual.outlineColor,'rgba(0, 0, 0, 0)');return actual;
}
async function run({width,lang,field}){
 const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'});ctx.setDefaultTimeout(15000);
 await ctx.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){report.mutations.push({method:q.method(),path:u.pathname,blocked:true});return r.abort();}if(u.origin!==new URL(base).origin){report.external.push({host:u.hostname,path:u.pathname,blocked:true});return r.abort();}return r.continue();});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'apply/');await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();await page.locator('[data-recruiter="yana"]').click();await page.locator('#candidateForm').waitFor();
  for(const[id,value]of [['firstName','QA'],['lastName','FIXTURE'],['phone','+99912345678'],['citizenship','FIXTURE'],['age','30']])await page.locator('#'+id).fill(value);
  await page.locator('#messenger').selectOption(field==='messenger'?'':'telegram');if(field==='messenger')await page.locator('[name="gender"][value="undisclosed"]').locator('..').click();
  const before=await values(page);assert.equal(before[field],'');await invalid(page,lang,field);const away=lang==='en'?'ru':'en';await language(page,away);assert.deepEqual(await values(page),before);assert.equal(await page.locator('.field-error').count(),0,'Language selection intentionally resets previous validation');await invalid(page,away,field);
  await language(page,lang);assert.deepEqual(await values(page),before);await invalid(page,lang,field);await page.evaluate(()=>document.fonts.ready);
  const dom=await page.locator(`#${field}-error`).evaluate((error,f)=>{
   const nodes=[...document.querySelectorAll(`[data-field="${f}"]`)],input=nodes[0],fieldNode=input.closest('.field'),box=error.getBoundingClientRect(),s=getComputedStyle(error),fieldBox=fieldNode.getBoundingClientRect();
   const clone=error.cloneNode(true);clone.style.cssText=`position:fixed;left:-10000px;top:0;visibility:hidden;display:block;width:${box.width}px;height:auto;max-height:none;overflow:visible;-webkit-line-clamp:unset;line-clamp:unset;font:${s.font};letter-spacing:${s.letterSpacing};white-space:${s.whiteSpace};box-sizing:${s.boxSizing};`;document.body.append(clone);const natural=clone.getBoundingClientRect().height;clone.remove();
   const choices=[...fieldNode.querySelectorAll('.choice-card')],choiceLabels=Object.fromEntries(choices.map(n=>[n.querySelector('input').value,n.querySelectorAll('span')[1].textContent]));
   const geometry=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
   const choiceGeometry=choices.map(n=>{const card=geometry(n),parts=[...n.querySelectorAll(':scope > span')].map(geometry),radio=n.querySelector('input'),rs=getComputedStyle(radio),cs=getComputedStyle(n),text=n.querySelectorAll('span')[1],range=document.createRange();range.selectNodeContents(text);const textRects=[...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}));return {value:radio.value,card,rawScrollWidth:n.scrollWidth,rawClientWidth:n.clientWidth,hiddenRadio:{...geometry(radio),opacity:rs.opacity,pointerEvents:rs.pointerEvents},focusStyle:{outlineStyle:cs.outlineStyle,outlineWidth:cs.outlineWidth,outlineColor:cs.outlineColor,outlineOffset:cs.outlineOffset,boxShadow:cs.boxShadow,borderColor:cs.borderColor},visualFits:[...parts,...textRects].every(r=>r.left>=card.left-1&&r.right<=card.right+1&&r.top>=card.top-1&&r.bottom<=card.bottom+1)};});
   return {actualLang:document.documentElement.lang,label:fieldNode.querySelector(f==='gender'?'.field-label':'label').textContent,error:error.textContent,value:f==='gender'?(fieldNode.querySelector(':checked')?.value||''):input.value,selectedText:f==='messenger'?input.options[input.selectedIndex].textContent:null,choiceLabels,choiceGeometry,invalidControlCount:nodes.length,focused:document.activeElement===input,associated:nodes.every(n=>n.getAttribute('aria-describedby')===error.id&&n.getAttribute('aria-invalid')==='true'),painted:error.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&fieldBox.width>0,fit:document.documentElement.scrollWidth<=innerWidth+1&&fieldBox.left>=-1&&fieldBox.right<=innerWidth+1&&box.height>=natural-1&&error.scrollWidth<=error.clientWidth+1&&choiceGeometry.every(n=>n.card.left>=fieldBox.left-1&&n.card.right<=fieldBox.right+1&&n.visualFits),step:document.querySelector('.progress-meta strong').textContent.trim()};
  },field);
  report.observations.push({field,width,lang,dom});
  for(const k of ['focused','associated','painted','fit'])assert.equal(dom[k],true,`${field}:${width}:${lang}:${k}`);assert.equal(dom.actualLang,lang);assert.equal(dom.step,'1 / 3');assert.equal(dom.error,labels[lang]);assert.equal(dom.value,'');assert.equal(dom.invalidControlCount,field==='gender'?3:1);
  if(field==='messenger'){assert.equal(dom.selectedText,fixture.messages[lang].placeholder);assert.equal(dom.label.replace(/\s*\*\s*$/,'').trim(),fixture.messages[lang].label);}else{assert.equal(dom.label.replace(/\s*\*\s*$/,'').trim(),fixture.gender[lang].label);assert.deepEqual(dom.choiceLabels,fixture.gender[lang].options);}
  const invalidFocus=field==='gender'?await visibleRadioFocus(page,'female'):null;
  await fieldShot(page,field,join(reportDir,`${field}-${width}-${lang}-field.png`));await page.screenshot({path:join(reportDir,`${field}-${width}-${lang}-viewport.png`)});
  const correction=field==='messenger'?'telegram':'undisclosed';if(field==='messenger')await page.locator('#messenger').selectOption(correction);else await page.locator(`[name="gender"][value="${correction}"]`).locator('..').click();
  const cleared=await page.locator(`#${field}-error`).count()===0&&await controls(page,field).evaluateAll(nodes=>nodes.every(n=>n.getAttribute('aria-invalid')===null&&n.getAttribute('aria-describedby')===null));assert.equal(cleared,true);assert.equal(await page.locator('[aria-invalid="true"]').count(),0);
  await page.locator('[data-action="next"]').click();await page.locator('#location').waitFor();assert.equal(await page.locator('.progress-meta strong').innerText(),'2 / 3');assert.equal(await page.locator('[data-action="send"]').count(),0);
  await page.locator('[data-action="back"]').click();await controls(page,field).first().waitFor({state:'attached'});assert.deepEqual(await values(page),{...before,[field]:correction});if(field==='messenger')assert.equal(await page.locator('#messenger option:checked').innerText(),fixture.messages[lang].recovery);
  let keyboardFocus=null;
  if(field==='gender'){await page.locator('#age').focus();await page.locator('#age').press('Tab');keyboardFocus=await visibleRadioFocus(page,'undisclosed');assert.deepEqual(await values(page),{...before,gender:'undisclosed'});await fieldShot(page,field,join(reportDir,`gender-keyboard-${width}-${lang}-field.png`));}
  assert.deepEqual(errors,[]);report.rows.push({field,width,lang,status:'passed',...dom,onlyTargetInvalid:true,invalidFocus,keyboardFocus,answersPreserved:true,languageRoundTrip:true,previousErrorResetThenRevalidated:true,allErrorAttributesClearedOnEdit:cleared,correctedAdvancesToStep2:true,backPreserved:true,noDelivery:true});
 }catch(e){await page.screenshot({path:join(reportDir,`failure-${field}-${width}-${lang}.png`)}).catch(()=>{});throw e;}finally{await ctx.close();}
}
try{
 await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();const cases=fields.flatMap(field=>[320,1280].flatMap(width=>Object.keys(labels).map(lang=>({width,lang,field}))));let next=0;await Promise.all(Array.from({length:2},async()=>{while(next<cases.length)await run(cases[next++]);}));
 assert.equal(report.rows.length,fields.length*40);const acceptedCaptures=report.captureGeometry.filter(r=>r.stable);assert.equal(acceptedCaptures.length,fields.includes('gender')?80:0);assert.equal(new Set(acceptedCaptures.map(r=>r.file)).size,acceptedCaptures.length);assert(report.mutations.every(r=>r.blocked&&r.method==='POST'&&r.path==='/api/public/funnel'));report.applicationDeliveryAttempts=0;report.status='PASSED_SHORT_FORM_REQUIRED_CASES';
}catch(e){report.status='FAILED';report.failure=e.stack;throw e;}finally{await browser?.close();await origin.stop();report.finished=new Date().toISOString();await writeFile(join(reportDir,'acceptance.json'),JSON.stringify(report,null,2)+'\n');}
