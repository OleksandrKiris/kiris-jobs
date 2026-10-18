import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

export const PDF_ALL_LANGUAGES=['pl','uk','ru','en','ka','az','hy','tr','uz','id','fil','vi','hi','ne','ky','tg','kk','bn','ur','si'];
export function pdfCopy(){
  const scope=vm.createContext({window:{},document:{getElementById:()=>({})},URL,location:{href:'https://fixture.invalid/apply/pdf/'},localStorage:{getItem:()=>null}});
  vm.runInContext(readFileSync('apply/pdf/translations.js','utf8'),scope);
  const app=readFileSync('apply/pdf/app.js','utf8');
  vm.runInContext(app.replace('render();})();','window.__PDF_COPY={L,B,T,S,t,pageWord};})();'),scope);
  const {L,B,T,S,t,pageWord}=scope.window.__PDF_COPY;
  const locales=Object.fromEntries(Object.keys(L).map(lang=>[lang,{...B,...T[lang]}]));
  return {languages:JSON.parse(JSON.stringify(L)),base:JSON.parse(JSON.stringify(B)),explicit:JSON.parse(JSON.stringify(T)),locales:JSON.parse(JSON.stringify(locales)),pageWord:(lang,n)=>{S.language=lang;return pageWord(n)}};
}
export function assertPdfCopy(data){
  assert.deepEqual(Object.keys(data.languages).sort(),[...PDF_ALL_LANGUAGES].sort());
  const keys=Object.keys(data.base).sort();assert.equal(keys.length,29);
  for(const lang of PDF_ALL_LANGUAGES){
    const own=lang==='en'?{...data.base,...data.explicit.en}:data.explicit[lang];
    assert.deepEqual(Object.keys(own).sort(),keys,'Explicit copy without fallback: '+lang);
    for(const k of keys)assert.ok(typeof own[k]==='string'&&own[k].trim(),lang+':'+k);
    if(lang!=='en')for(const k of ['localOnly','documentTitle','photosHint','saveHint','summary','generated','remove','empty'])assert.notEqual(own[k],data.base[k],lang+':'+k+':English fallback');
  }
}
export function assertEmptyGeometry(g){
  assert.ok(g.emptyBottom<=g.footerTop+1,'Empty state overlaps footer');
  assert.ok(g.footerBottom<=g.coverBottom+1,'Footer clipped by cover');
  assert.ok(g.emptyBottom<=g.coverBottom+1,'Empty state clipped by cover');
  assert.ok(g.emptyHeight>=g.emptyTextHeight,'Empty message clipped');
}
export async function emptyGeometry(page){
  await page.evaluate(()=>document.fonts.ready);
  return page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect();
    const cover=rect('.pdf-cover'),empty=rect('.empty-preview'),footer=rect('.pdf-footer');
    const range=document.createRange();range.selectNodeContents(document.querySelector('.empty-preview'));
    return {coverBottom:cover.bottom,emptyBottom:empty.bottom,footerTop:footer.top,footerBottom:footer.bottom,emptyHeight:empty.height,emptyTextHeight:range.getBoundingClientRect().height};
  });
}
export async function visiblePdfCopy(page,copy){
  for(const [selector,key]of [['#brandSubtitle','brand'],['h1','title'],['.lead','lead'],['.eyebrow','localOnly'],['.upload-box strong','addPhotos'],['.upload-box small','photosHint'],['#printButton','create'],['#clearButton','clear'],['.help','saveHint'],['.empty-preview','empty'],['.pdf-brand span','summary'],['.pdf-title','defaultTitle'],['.pdf-footer span:last-child','generated'],['#footerText','private']]){
    const text=(await page.locator(selector).textContent()).trim().replace(/^＋\s*/, '');assert.equal(text,copy[key],selector);
  }
  for(const [id,key]of [['language','language'],['title','documentTitle'],['name','name'],['phone','phone'],['email','email'],['citizenship','citizenship'],['location','location'],['job','job'],['note','note']])assert.equal((await page.locator(`label[for="${id}"]`).textContent()).trim(),copy[key]);
  assert.equal((await page.locator('.upload-box').locator('..').locator('label').textContent()).trim(),copy.photos);
  assert.ok((await page.locator('.privacy-note').textContent()).includes(copy.private));
  assert.equal((await page.locator('.preview-title > span:first-child').textContent()).trim(),copy.preview);
}
