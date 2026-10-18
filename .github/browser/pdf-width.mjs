import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {PDF_ALL_LANGUAGES,visiblePdfCopy,emptyGeometry,assertEmptyGeometry} from './pdf-copy.mjs';
import {rejectBrokenPhoto,addMixedPhotos} from './pdf-photo-acceptance.mjs';

export const WIDTH_OLD='7eed857e3e286bafd2ab4d95f02d5abd62a451aa';
const required=['header','back','main','controls','preview','cover','footer','upload','print','clear'];
export function assertInlineFit(g){
  assert.ok(Number.isFinite(g.clientWidth)&&g.clientWidth>0,'Missing client width');
  assert.ok(g.scrollWidth<=g.clientWidth+1,'Content exceeds actual client width');
  assert.ok(Number.isFinite(g.left)&&Number.isFinite(g.right)&&g.right>g.left,'Missing scrollport edges');
  for(const key of required)assert.ok(g.rects.some(r=>r.key===key),'Missing visible region: '+key);
  for(const r of g.rects){
    assert.ok(Number.isFinite(r.left)&&Number.isFinite(r.right)&&r.right>r.left,'Invalid region: '+r.key);
    assert.ok(r.left>=g.left-1&&r.right<=g.right+1,'Region outside client area: '+r.key);
  }
}
export function assertClassicGutter(g){
  assert.ok(g.innerWidth-g.clientWidth>=10&&g.innerWidth-g.clientWidth<=25,'Fixture must actually reserve a scrollbar gutter');
  assert.equal(g.gutter,'stable');
}
export function assertScrollbarRows(rows){
  assert.deepEqual(rows?.map(r=>r.lang).sort(),[...PDF_ALL_LANGUAGES].sort());
  for(const r of rows){
    for(const key of ['passed','empty','rejected','filled','copy','preview','decodedPhoto','localOnly'])assert.equal(r[key],true,r.lang+':'+key);
    for(const g of [r.emptyGeometry,r.rejectedGeometry,r.filledGeometry]){assertClassicGutter(g);assertInlineFit(g);}
  }
}
export async function inlineGeometry(page){
  await page.evaluate(()=>document.fonts.ready);
  return page.evaluate(()=>{
    const root=document.documentElement,box=root.getBoundingClientRect();
    const selectors={header:'.site-header',back:'#backLink',main:'#pdfApp',controls:'.controls',preview:'.preview-panel',cover:'.pdf-cover',footer:'.site-footer',upload:'.upload-box',print:'#printButton',clear:'#clearButton'};
    const rects=Object.entries(selectors).map(([key,selector])=>{const n=document.querySelector(selector),r=n.getBoundingClientRect();return {key,left:r.left,right:r.right};});
    for(const [i,n]of [...document.querySelectorAll('.field input:not([type=file]),.field select,.field textarea,.file-row,.photo-errors:not(:empty),.photo-sheet')].entries()){
      const r=n.getBoundingClientRect();rects.push({key:'control-'+i,left:r.left,right:r.right});
    }
    return {innerWidth,clientWidth:root.clientWidth,scrollWidth:root.scrollWidth,left:box.left+root.clientLeft,right:box.left+root.clientLeft+root.clientWidth,gutter:getComputedStyle(root).scrollbarGutter,bodyWidth:document.body.getBoundingClientRect().width,rects};
  });
}
async function classicGutter(page){
  // CI-only controlled condition: native IAB also reproduced this with a real scrollbar.
  // Style properties reserve the layout space in headless Chromium; no CSP bypass.
  await page.evaluate(()=>{document.documentElement.style.scrollbarGutter='stable';document.documentElement.style.overflowY='scroll';});
  const geometry=await inlineGeometry(page);assertClassicGutter(geometry);return geometry;
}
export async function scrollbarOldRed({context,base,shot,close,report,setActive}){
  const files=Object.fromEntries(['index.html','app.js','styles.css','navigation.js','translations.js','images.js'].map(n=>['apply/pdf/'+n,execFileSync('git',['show',WIDTH_OLD+':apply/pdf/'+n])]));
  report.scrollbarOldSource={ref:WIDTH_OLD,files:Object.fromEntries(Object.entries(files).map(([f,b])=>[f,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}]))};report.scrollbarOldRed=[];
  for(const lang of ['en','ur']){
    const ctx=await context(320),page=await ctx.newPage();setActive(page);
    for(const [file,bytes]of Object.entries(files)){
      const suffix=file.endsWith('index.html')?file.slice(0,-10):file;
      await ctx.route(new RegExp('/kiris-jobs/'+suffix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\?.*)?$'),r=>r.fulfill({status:200,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript',body:bytes}));
    }
    await page.goto(base+'apply/pdf/?lang='+lang);const geometry=await classicGutter(page);
    assert.ok(geometry.scrollWidth>geometry.clientWidth+10);assert.throws(()=>assertInlineFit(geometry));
    await shot(page,'scrollbar-old-'+lang+'-320');report.scrollbarOldRed.push({ref:WIDTH_OLD,lang,width:320,status:'expected-failure',geometry,scope:'Pinned published119 with controlled stable scrollbar gutter'});await close(ctx,'scrollbar-old-'+lang);
  }
}
export async function scrollbarCurrent({context,base,shot,close,report,setActive,copyData}){
  report.scrollbarRows=[];
  for(const lang of PDF_ALL_LANGUAGES){
    const ctx=await context(320),page=await ctx.newPage();setActive(page);await page.goto(base+'apply/pdf/?lang='+lang);await classicGutter(page);
    const copy=copyData.locales[lang];await visiblePdfCopy(page,copy);assertEmptyGeometry(await emptyGeometry(page));
    const empty=await inlineGeometry(page);assertInlineFit(empty);await shot(page,'scrollbar-empty-'+lang+'-320');
    await rejectBrokenPhoto(page,copy);const rejected=await inlineGeometry(page);assertInlineFit(rejected);await shot(page,'scrollbar-rejected-'+lang+'-320');
    await page.locator('#name').fill('QA_WIDTH_FIXTURE');await page.locator('#note').fill('QA · '+copy.empty);await page.locator('#phone').fill('+99912345678');
    await addMixedPhotos(page,copy);const filled=await inlineGeometry(page);assertInlineFit(filled);
    const cover=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {coverBottom:r('.pdf-cover').bottom,footerTop:r('.pdf-footer').top,footerBottom:r('.pdf-footer').bottom,noteBottom:r('.pdf-note').bottom};});
    assert.ok(cover.footerBottom<=cover.coverBottom+1&&cover.noteBottom<=cover.footerTop+1);
    await shot(page,'scrollbar-filled-'+lang+'-320');
    report.scrollbarRows.push({lang,width:320,passed:true,empty:true,rejected:true,filled:true,copy:true,preview:true,decodedPhoto:true,localOnly:true,emptyGeometry:empty,rejectedGeometry:rejected,filledGeometry:filled,cover,scope:'Controlled stable scrollbar gutter without CSP bypass; normal320/1280 and A4 print retained separately'});await close(ctx,'scrollbar-'+lang);
  }
  assertScrollbarRows(report.scrollbarRows);
}
