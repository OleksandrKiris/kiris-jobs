// CI-only anonymous contact fixtures. No application delivery or new validation rules.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
export async function fieldVisual(page) {
 return page.evaluate(()=>[...document.querySelectorAll('.application-field.is-invalid')].map(field=>{
  const control=field.querySelector('input,select,textarea'),error=field.querySelector('.application-field-error'),pseudo=getComputedStyle(field,'::after');
  return {name:control?.name,greenVisible:!['none','normal','""'].includes(pseudo.content)&&pseudo.display!=='none',border:control?getComputedStyle(control).borderTopColor:null,errorColor:error?getComputedStyle(error).color:null,focused:control===document.activeElement,shadow:control?getComputedStyle(control).boxShadow:null};
 }));
}
export function correctFieldVisual(fields) {
 return fields.length>0&&fields.every(f=>!f.greenVisible&&f.border==='rgb(189, 67, 60)'&&(!f.errorColor||f.errorColor==='rgb(166, 50, 45)'));
}
export function assertFieldStatusProof(report) {
 assert.deepEqual(report.formFieldStatusOldRed?.map(r=>r.width).sort((a,b)=>a-b),[320,1280]);
 for(const r of report.formFieldStatusOldRed){assert.equal(r.ref,'f9df539cee3033cd444b21a9d55dbc2c363a3675');assert.equal(r.status,'expected-failure');assert.equal(r.greenVisible,true);assert.equal(r.borderMismatch,true);assert.equal(r.inlineColorMismatch,true);}
 const rows=report.formFieldLifecycle;assert.equal(rows?.length,4);
 assert.deepEqual(rows.map(r=>`${r.width}:${r.kind}`).sort(),[320,1280].flatMap(w=>['latin','phone'].map(k=>`${w}:${k}`)).sort());
 for(const r of rows){assert.equal(r.status,'passed');for(const key of ['focusedErrorRed','clearedOnEdit','restoredOnRevalidate','sameStep','notSubmitted'])assert.equal(r[key],true);}
}
async function fixture(page,base,kind){
 await page.goto(base+'vacancies/banana-warehouse-poland/?lang=en&apply=1');await page.locator('#application-form').waitFor();
 await page.locator('[name="firstName"]').fill(kind==='latin'?'ТЕСТ':'QA');await page.locator('[name="lastName"]').fill('FIXTURE');await page.locator('[name="phone"]').fill('+123');await page.locator('#application-form button[type="submit"]').click();
}
export async function acceptFieldStatusProof({context,base,reportDir,report,active}) {
 assert.equal(process.env.GITHUB_ACTIONS,'true');report.formFieldStatusOldRed=[];report.formFieldLifecycle=[];
 const ref='f9df539cee3033cd444b21a9d55dbc2c363a3675',oldStyle=execFileSync('git',['show',ref+':assets/clean.css']);
 for(const width of [320,1280]){
  const oldCtx=await context({width,height:900});await oldCtx.route('**/clean.css?*',r=>r.fulfill({status:200,contentType:'text/css',body:oldStyle}));const old=await oldCtx.newPage();active(old);await fixture(old,base,'latin');const fields=await fieldVisual(old);assert.equal(correctFieldVisual(fields),false);const f=fields[0];assert.equal(f.greenVisible,true);await old.screenshot({path:join(reportDir,`field-status-old-red-${width}.png`)});report.formFieldStatusOldRed.push({width,ref,status:'expected-failure',greenVisible:f.greenVisible,borderMismatch:f.border!=='rgb(189, 67, 60)',inlineColorMismatch:f.errorColor!=='rgb(166, 50, 45)'});await oldCtx.close();
  for(const kind of ['latin','phone']){
   const ctx=await context({width,height:900}),page=await ctx.newPage();active(page);await fixture(page,base,kind);assert.equal(correctFieldVisual(await fieldVisual(page)),true);
   const name=kind==='latin'?'firstName':'phone',bad=kind==='latin'?'ТЕСТ':'+123',good=kind==='latin'?'QA':'+99912345678';
   await page.locator(`[name="${name}"]`).click();await page.waitForFunction(name=>{const el=document.querySelector(`[name="${name}"]`);return el===document.activeElement&&getComputedStyle(el).boxShadow.includes('189, 67, 60');},name);const focused=await fieldVisual(page);const focusedErrorRed=correctFieldVisual(focused)&&focused[0].focused&&focused[0].shadow.includes('189, 67, 60');
   await page.locator(`[name="${name}"]`).fill(good);const clearedOnEdit=await page.evaluate(()=>!document.querySelector('.application-field.is-invalid')&&document.querySelector('#application-error').hidden);
   await page.locator(`[name="${name}"]`).fill(bad);await page.locator('#application-form button[type="submit"]').click();const restoredOnRevalidate=correctFieldVisual(await fieldVisual(page));
   const dom=await page.evaluate(()=>({sameStep:document.querySelector('.application-header').dataset.stage==='1',notSubmitted:!document.querySelector('.application-success')}));
   await page.screenshot({path:join(reportDir,`field-status-cycle-${width}-${kind}.png`)});report.formFieldLifecycle.push({width,kind,status:'passed',focusedErrorRed,clearedOnEdit,restoredOnRevalidate,...dom});await ctx.close();
  }
 }
 assertFieldStatusProof(report);
}
