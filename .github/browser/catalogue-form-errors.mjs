// CI-only isolated anonymous fixtures. No submissions or external services.
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
export const FORM_ERROR_LABELS = {
  "ru": {
    "missing": "Заполните обязательные поля.",
    "latin": "Используйте только латинские буквы, пробел, дефис или апостроф.",
    "phone": "Введите номер в международном формате: + и 8–15 цифр."
  },
  "uk": {
    "missing": "Заповніть обов’язкові поля.",
    "latin": "Використовуйте лише латинські літери, пробіл, дефіс або апостроф.",
    "phone": "Введіть номер у міжнародному форматі: + і 8–15 цифр."
  },
  "pl": {
    "missing": "Uzupełnij wymagane pola.",
    "latin": "Użyj wyłącznie liter alfabetu łacińskiego, spacji, łącznika lub apostrofu.",
    "phone": "Wpisz numer w formacie międzynarodowym: + oraz 8–15 cyfr."
  },
  "en": {
    "missing": "Complete all required fields.",
    "latin": "Use only Latin letters, spaces, hyphens or apostrophes.",
    "phone": "Enter an international number: + followed by 8–15 digits."
  },
  "az": {
    "missing": "Məcburi sahələri doldurun.",
    "latin": "Yalnız ingilis latın hərflərindən A–Z, boşluq, defis və ya apostrofdan istifadə edin.",
    "phone": "Nömrəni beynəlxalq formatda daxil edin: + və 8–15 rəqəm."
  },
  "ka": {
    "missing": "შეავსეთ სავალდებულო ველები.",
    "latin": "გამოიყენეთ მხოლოდ ინგლისური ლათინური ასოები A–Z, გამოტოვება, დეფისი ან აპოსტროფი.",
    "phone": "შეიყვანეთ ნომერი საერთაშორისო ფორმატში: + და 8–15 ციფრი."
  },
  "id": {
    "missing": "Lengkapi semua kolom wajib.",
    "latin": "Gunakan hanya huruf Latin, spasi, tanda hubung, atau apostrof.",
    "phone": "Masukkan nomor internasional: tanda + diikuti 8–15 angka."
  },
  "es": {
    "missing": "Completa todos los campos obligatorios.",
    "latin": "Usa solo letras latinas, espacios, guiones o apóstrofos.",
    "phone": "Introduce un número internacional: + y entre 8 y 15 dígitos."
  },
  "fil": {
    "missing": "Kumpletuhin ang lahat ng required field.",
    "latin": "Latin letters, space, gitling, o apostrophe lang ang gamitin.",
    "phone": "Ilagay sa international format: + at 8–15 numero."
  },
  "ne": {
    "missing": "सबै अनिवार्य ठाउँ भर्नुहोस्।",
    "latin": "Latin अक्षर, खाली ठाउँ, हाइफन वा apostrophe मात्र प्रयोग गर्नुहोस्।",
    "phone": "अन्तर्राष्ट्रिय नम्बर लेख्नुहोस्: + र ८–१५ अङ्क।"
  },
  "hy": {
    "missing": "Լրացրեք պարտադիր դաշտերը։",
    "latin": "Օգտագործեք միայն անգլերեն լատինատառ A–Z տառեր, բացատ, գծիկ կամ ապաթարց։",
    "phone": "Մուտքագրեք համարը միջազգային ձևաչափով՝ + և 8–15 թվանշան։"
  }
};
export const FORM_ERROR_CASES=['missing','latin','phone'];
export function assertFormErrors(rows){
 assert.equal(rows?.length,66);assert.deepEqual(rows.map(r=>`${r.width}:${r.lang}:${r.kind}`).sort(),[320,1280].flatMap(width=>Object.keys(FORM_ERROR_LABELS).flatMap(lang=>FORM_ERROR_CASES.map(kind=>`${width}:${lang}:${kind}`))).sort());
 for(const r of rows){assert.equal(r.status,'passed');assert.equal(r.error,FORM_ERROR_LABELS[r.lang][r.kind]);for(const k of ['roundTrip','preserved','associated','fits','notSubmitted'])assert.equal(r[k],true,`${r.lang}:${r.kind}:${k}`);}
}
export function assertFormUpgrades(rows,workerChanged=true){
 if(!workerChanged){assert.deepEqual(rows,[]);return;}
 assert.deepEqual(rows?.map(r=>r.width).sort((a,b)=>a-b),[320,1280]);for(const r of rows){assert.equal(r.status,'passed');assert.equal(r.originStopped,true);assert.equal(r.baseFormExact,true);assert.equal(r.headFormExact,true);assert.equal(r.headLoaderExact,true);assert.deepEqual(r.offlineLanguages,['pl','uk']);}
}
async function locale(page,lang){await page.locator('.language-switcher-button').click();await page.locator(`[data-language-option="${lang}"]`).click();await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);}
async function values(page){return page.evaluate(()=>Object.fromEntries(['firstName','lastName','phone'].map(k=>[k,document.querySelector(`[name="${k}"]`).value])));}
export async function acceptFormErrors({context,base,reportDir,report,active}){
 assert.equal(process.env.GITHUB_ACTIONS,'true');report.formErrors=[];report.formErrorOldRed=[];
 const oldRef='01cc8c7f30ac5c54587da9431a7cfd382353e9e4';const oldApp=execFileSync('git',['show',oldRef+':assets/application-form.js']);
 for(const width of [320,1280]){
  const oldCtx=await context({width,height:900});await oldCtx.route('**/application-form.js?*',r=>r.fulfill({status:200,contentType:'text/javascript',body:oldApp}));const old=await oldCtx.newPage();active(old);
  await old.goto(base+'vacancies/banana-warehouse-poland/?lang=ru&apply=1');await old.locator('#application-form').waitFor();await old.locator('#application-form button[type="submit"]').click();assert.equal(await old.locator('#application-error').innerText(),FORM_ERROR_LABELS.ru.missing);await locale(old,'ka');assert.equal(await old.locator('#application-error').innerText(),FORM_ERROR_LABELS.ru.missing);assert.notEqual(await old.locator('#application-error').innerText(),FORM_ERROR_LABELS.ka.missing);await old.screenshot({path:join(reportDir,`form-error-old-red-${width}.png`)});report.formErrorOldRed.push({width,ref:oldRef,status:'expected-failure',from:'ru',to:'ka',error:FORM_ERROR_LABELS.ru.missing});await oldCtx.close();
  for(const lang of Object.keys(FORM_ERROR_LABELS))for(const kind of FORM_ERROR_CASES){
   const from=lang==='en'?'ru':'en';const ctx=await context({width,height:900}),page=await ctx.newPage();active(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+`vacancies/banana-warehouse-poland/?lang=${from}&apply=1`);await page.locator('#application-form').waitFor();
   if(kind!=='missing'){await page.locator('[name="firstName"]').fill(kind==='latin'?'ТЕСТ':'QA');await page.locator('[name="lastName"]').fill('FIXTURE');await page.locator('[name="phone"]').fill('+123');}
   await page.locator('#application-form button[type="submit"]').click();assert.equal(await page.locator('#application-error').innerText(),FORM_ERROR_LABELS[from][kind]);const before=await values(page);
   await locale(page,lang);const error=await page.locator('#application-error').innerText();assert.equal(error,FORM_ERROR_LABELS[lang][kind]);const preserved=JSON.stringify(before)===JSON.stringify(await values(page));
   const associated=await page.evaluate(()=>{const field=document.querySelector('.application-field.is-invalid');return Boolean(field&&field.querySelector('.application-field-error')?.textContent===document.querySelector('#application-error').textContent);});
   await locale(page,from);const roundTrip=await page.locator('#application-error').innerText()===FORM_ERROR_LABELS[from][kind];await locale(page,lang);
   const dom=await page.evaluate(()=>({fits:document.documentElement.scrollWidth<=innerWidth+1,notSubmitted:document.querySelector('#application-form')!==null&&!document.querySelector('.application-success')}));
   await page.locator('#application-error').scrollIntoViewIfNeeded();await page.screenshot({path:join(reportDir,`form-error-${width}-${lang}-${kind}.png`)});
   report.formErrors.push({width,lang,kind,status:'passed',error,preserved,associated,roundTrip,...dom});assert.deepEqual(errors,[]);await ctx.close();
  }
 }
 assertFormErrors(report.formErrors);
}
export async function cachedFormHash(page,cacheName,url){return page.evaluate(async({cacheName,url})=>{const response=await(await caches.open(cacheName)).match(url);if(!response)return null;const bytes=await response.arrayBuffer();return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');},{cacheName,url});}
export async function acceptOfflineFormErrors({page,base,width,reportDir}){
 await page.goto(base+'vacancies/banana-warehouse-poland/?lang=uk&apply=1');await page.locator('#application-form').waitFor();await page.locator('#application-form button[type="submit"]').click();assert.equal(await page.locator('#application-error').innerText(),FORM_ERROR_LABELS.uk.missing);
 await locale(page,'pl');assert.equal(await page.locator('#application-error').innerText(),FORM_ERROR_LABELS.pl.missing);await locale(page,'uk');assert.equal(await page.locator('#application-error').innerText(),FORM_ERROR_LABELS.uk.missing);await page.locator('#application-error').scrollIntoViewIfNeeded();await page.screenshot({path:join(reportDir,`form-error-upgrade-offline-${width}.png`)});return ['pl','uk'];
}
