import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
export const PHOTO_OLD='93d0c2c5b98d2e56e4fa523d4b120db14de79785';
export const BAD_PHOTO={name:'broken <b>fixture</b>.png',mimeType:'image/png',buffer:Buffer.from('FICTIONAL INVALID IMAGE BYTES')};
const goodPhoto=async()=>({name:'fixture-logo.png',mimeType:'image/png',buffer:await readFile('assets/icon-192.png')});

export async function rejectBrokenPhoto(page,copy){
  assert.equal(await page.locator('#photos').getAttribute('aria-label'),copy.addPhotos);
  assert.equal(await page.locator('label[for="photos"]').textContent(),copy.photos);
  assert.equal(await page.locator('#photos').getAttribute('aria-describedby'),'photosHint photoStatus photoErrors');
  await page.locator('#photos').setInputFiles(BAD_PHOTO);
  await page.locator('#photoErrors').waitFor({state:'visible'});
  const error=await page.locator('#photoErrors').textContent();
  for(const value of [copy.imageNotAdded,copy.imageUnreadable,BAD_PHOTO.name])assert.ok(error.includes(value));
  assert.equal(await page.locator('#photoErrors b').count(),0);
  assert.equal(await page.locator('.photo-sheet').count(),0);
  assert.equal(await page.locator('.file-row').count(),0);
  assert.equal(await page.locator('#printButton').isEnabled(),true);
  assert.ok((await page.locator('.page-count').textContent()).trim().startsWith('1 '));
  return {uploadAccessible:true,badPhotoRejected:true,error};
}
export async function addMixedPhotos(page,copy){
  await page.locator('#photos').setInputFiles([await goodPhoto(),BAD_PHOTO]);
  await page.locator('.photo-sheet img').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('.file-list').getAttribute('aria-busy')==='false');
  const image=await page.locator('.photo-sheet img').evaluate(n=>({complete:n.complete,width:n.naturalWidth,height:n.naturalHeight}));
  assert.ok(image.complete&&image.width>0&&image.height>0);
  assert.equal(await page.locator('.photo-sheet').count(),1);assert.equal(await page.locator('.file-row').count(),1);
  assert.ok((await page.locator('#photoErrors').textContent()).includes(copy.imageUnreadable));
  assert.ok((await page.locator('.page-count').textContent()).trim().startsWith('2 '));
  assert.equal(await page.locator('#printButton').isEnabled(),true);
  return {decodedPhoto:true,mixedPhotoCount:true,image};
}
export async function photoOldRed({context,base,shot,close,report,setActive}){
  assert.equal(process.env.GITHUB_ACTIONS,'true');
  const files=Object.fromEntries(['index.html','app.js','styles.css','translations.js','navigation.js'].map(f=>['apply/pdf/'+f,execFileSync('git',['show',PHOTO_OLD+':apply/pdf/'+f])]));
  report.imageRegressionSource={ref:PHOTO_OLD,files:Object.fromEntries(Object.entries(files).map(([f,b])=>[f,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}]))};report.imageOldRed=[];
  for(const [width,lang]of [[320,'ur'],[1280,'ru']]){
    const ctx=await context(width),page=await ctx.newPage();setActive(page);
    for(const [file,bytes]of Object.entries(files)){
      const suffix=file.endsWith('index.html')?file.slice(0,-10):file;
      await ctx.route(new RegExp('/kiris-jobs/'+suffix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\?.*)?$'),r=>r.fulfill({status:200,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript',body:bytes}));
    }
    await page.goto(base+'apply/pdf/?lang='+lang);assert.equal(await page.locator('#photos').getAttribute('aria-label'),null);
    await page.locator('#photos').setInputFiles(BAD_PHOTO);
    await page.waitForFunction(()=>{const n=document.querySelector('.photo-sheet img');return n?.complete&&n.naturalWidth===0});
    assert.equal(await page.locator('.photo-sheet').count(),1);assert.equal(await page.locator('[role="alert"]').count(),0);
    assert.ok((await page.locator('.page-count').textContent()).trim().startsWith('2 '));
    await shot(page,`image-old-${lang}-${width}`);report.imageOldRed.push({ref:PHOTO_OLD,lang,width,status:'expected-failure',corruptFileAdded:true,blankPageCounted:true,unlabelledUpload:true});await close(ctx,`image-old-${lang}-${width}`);
  }
}
export async function photoRaceAndSize({context,base,shot,close,report,setActive,copyData}){
  report.imageRaceCases=[];report.imageSizeCases=[];
  for(const [width,lang]of [[320,'ur'],[1280,'ru']]){
    const ctx=await context(width);await ctx.addInitScript(()=>{
      // Controlled delay only: release the real browser decoder on fixture bytes.
      const NativeImage=window.Image,src=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');let hold=true;const held=[];
      window.Image=new Proxy(NativeImage,{construct(Target,args){const image=new Target(...args);Object.defineProperty(image,'src',{get(){return src.get.call(image)},set(value){if(hold&&value)held.push({image,value});else src.set.call(image,value)}});return image}});
      window.__releasePhotoChecks=()=>{hold=false;return Promise.all(held.splice(0).map(({image,value})=>new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});src.set.call(image,value)})))};
      window.__fixturePrintCalls=0;window.print=()=>window.__fixturePrintCalls++;
    });
    const page=await ctx.newPage();setActive(page);await page.goto(base+'apply/pdf/?lang='+lang);
    await page.locator('#name').fill('QA_PENDING_FIXTURE');await page.locator('#photos').setInputFiles(await goodPhoto());
    assert.equal(await page.locator('#printButton').isEnabled(),false);assert.equal(await page.locator('#photos').isEnabled(),false);
    assert.equal(await page.locator('#photoStatus').textContent(),copyData.locales[lang].checkingPhotos);
    await page.locator('#printButton').evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert.equal(await page.evaluate(()=>window.__fixturePrintCalls),0);
    const switched=lang==='ur'?'ru':'ur';await page.locator('#language').selectOption(switched);
    assert.equal(await page.locator('#photoStatus').textContent(),copyData.locales[switched].checkingPhotos);assert.equal(await page.locator('#name').inputValue(),'QA_PENDING_FIXTURE');
    await shot(page,`image-pending-${lang}-${width}`);
    await page.locator('#clearButton').click();await page.evaluate(()=>window.__releasePhotoChecks());
    assert.equal(await page.locator('#name').inputValue(),'');assert.equal(await page.locator('.photo-sheet').count(),0);assert.equal(await page.locator('#photoStatus').textContent(),'');assert.equal(await page.locator('#photoErrors').textContent(),'');assert.equal(await page.locator('#printButton').isEnabled(),true);
    await page.locator('#printButton').click();assert.equal(await page.evaluate(()=>window.__fixturePrintCalls),1);
    await page.locator('#photos').setInputFiles(await goodPhoto());await page.locator('.photo-sheet img').waitFor({state:'visible'});assert.equal(await page.locator('.file-row').count(),1);
    await shot(page,`image-clear-race-${lang}-${width}`);report.imageRaceCases.push({lang,width,passed:true,scope:'Controlled hold around the real browser Image decoder on a public fixture; print calls intercepted in this context only',pendingBlocksPrint:true,pendingLocalizedAfterSwitch:true,clearCancels:true,noResurrection:true,freshSelectionWorks:true});
    await page.locator('#photos').setInputFiles({name:'oversize-fixture.png',mimeType:'image/png',buffer:Buffer.alloc(20*1048576+1)});
    await page.locator('#photoErrors').waitFor({state:'visible'});assert.ok((await page.locator('#photoErrors').textContent()).includes(copyData.locales[switched].imageTooLarge));assert.equal(await page.locator('.photo-sheet').count(),1);assert.ok((await page.locator('.page-count').textContent()).trim().startsWith('2 '));assert.equal(await page.locator('#printButton').isEnabled(),true);
    await shot(page,`image-size-${lang}-${width}`);report.imageSizeCases.push({lang:switched,width,passed:true,bytes:20*1048576+1,rejected:true,previousPhotoKept:true,noExtraPage:true});await close(ctx,`image-race-size-${lang}-${width}`);
  }
}
