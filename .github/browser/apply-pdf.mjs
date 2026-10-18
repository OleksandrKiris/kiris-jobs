import {photoOldRed,rejectBrokenPhoto,addMixedPhotos,photoRaceAndSize} from './pdf-photo-acceptance.mjs';
import {scrollbarOldRed,scrollbarCurrent} from './pdf-width.mjs';
import {PDF_ALL_LANGUAGES,pdfCopy,assertPdfCopy,assertEmptyGeometry,emptyGeometry,visiblePdfCopy} from './pdf-copy.mjs';
// Personal acceptance on isolated GitHub Actions contexts; no external delivery.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,mkdtemp,symlink} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {staticOrigin} from './static-origin.mjs';
import {captureStagedPublication} from './catalogue-scope.mjs';

export const PDF_LANGUAGES=PDF_ALL_LANGUAGES;
const existingTitles={pl:'Utwórz PDF',uk:'Створити PDF',ru:'Создать PDF',en:'Create PDF',ka:'PDF-ის შექმნა',az:'PDF yaradın',hy:'Ստեղծել PDF',tr:'PDF oluştur',uz:'PDF yaratish'};
const copyData=pdfCopy();assertPdfCopy(copyData);
const titles=Object.fromEntries(PDF_LANGUAGES.map(l=>[l,copyData.locales[l].title]));
assert.deepEqual(Object.fromEntries(Object.keys(existingTitles).map(l=>[l,titles[l]])),existingTitles);
const OLD='3fb5e53647a4fc025ad8fb8621308ce7f1a6e11a';
const draftKey='citronex_screening_application_v17';
export function assertPdfRows(rows){
  assert.deepEqual(rows?.map(r=>r.width+':'+r.lang).sort(),[320,1280].flatMap(w=>PDF_LANGUAGES.map(l=>w+':'+l)).sort());
  for(const r of rows)for(const k of ['passed','footer','review','language','returnRoute','draft','fits','noCandidateURL','copy','preview','direction','numericLTR','photoPreserved','print','uploadAccessible','badPhotoRejected','decodedPhoto','mixedPhotoCount'])assert.equal(r[k],true,`${r.lang}:${r.width}:${k}`);
}

export async function runPdfAcceptance(){
  assert.equal(process.env.GITHUB_ACTIONS,'true','Browser execution belongs to the authorized CI environment');
  const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE);
  const artifact=resolve(process.env.PAGES_ARTIFACT),out=resolve(process.env.BROWSER_REPORT);
  await mkdir(out,{recursive:true});
  const checkout=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const publication=captureStagedPublication(process.cwd(),artifact,checkout);
  const root=await mkdtemp(join(tmpdir(),'primserv-pdf-'));await symlink(artifact,join(root,'kiris-jobs'),'dir');
  const origin=staticOrigin(root),base='http://127.0.0.1:4173/kiris-jobs/';
  const report={head:process.env.TESTED_HEAD,base:process.env.TESTED_BASE,checkout,started:new Date().toISOString(),rows:[],oldRed:[],edgeCases:[],mutations:[],external:[],files:publication.files};
  let browser,active;
  async function context(width,denied=false){
    const ctx=await browser.newContext({viewport:{width,height:900},locale:'en-GB',serviceWorkers:'block'});ctx.setDefaultTimeout(10000);
    await ctx.tracing.start({screenshots:true,snapshots:true,sources:true});
    await ctx.route('**/*',r=>{
      if(!['GET','HEAD'].includes(r.request().method())){report.mutations.push(r.request().method());return r.abort();}
      if(new URL(r.request().url()).origin!==new URL(base).origin){report.external.push(r.request().url().split('?')[0]);return r.abort();}
      return r.continue();
    });
    if(denied)await ctx.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Fixture storage denied','SecurityError')}}));
    return ctx;
  }
  async function fits(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  async function shot(page,name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(out,name+'.png'),fullPage:true});}
  async function close(ctx,name){await ctx.tracing.stop({path:join(out,name+'.zip')});await ctx.close();}
  try{
    await origin.start();browser=await chromium.launch({headless:true});report.browser=browser.version();
    const oldFiles={};
    for(const file of ['apply/index.html','apply/app.js','apply/pdf/index.html','apply/pdf/app.js']){
      const bytes=execFileSync('git',['show',OLD+':'+file]);oldFiles[file]=bytes;
    }
    report.oldSource={ref:OLD,files:Object.fromEntries(Object.entries(oldFiles).map(([f,b])=>[f,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}]))};
    for(const lang of ['en','ru']){
      const ctx=await context(320),page=await ctx.newPage();active=page;
      for(const [file,bytes]of Object.entries(oldFiles)){
        const suffix=file.endsWith('index.html')?file.slice(0,-10):file;
        await ctx.route(new RegExp('/kiris-jobs/'+suffix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\?.*)?$'),r=>r.fulfill({status:200,contentType:file.endsWith('.html')?'text/html':'text/javascript',body:bytes}));
      }
      await page.goto(base+'apply/?lang='+lang);await page.locator(`[data-language="${lang}"]`).click();
      await page.locator('#footerPdf').click();
      assert.equal(await page.locator('html').getAttribute('lang'),'pl');assert.equal(await page.locator('h1').innerText(),titles.pl);
      assert.equal(new URL(await page.locator('#backLink').getAttribute('href'),page.url()).search,'');
      await shot(page,'old-'+lang+'-to-pl-320');report.oldRed.push({lang,actual:'pl',width:320,ref:OLD,status:'expected-failure'});await close(ctx,'old-'+lang);
    }
    const copyRef='3aa1f00163de5342d2c67c2af0adf92da909cd5f';
    const copyOldFiles=Object.fromEntries(['apply/pdf/index.html','apply/pdf/app.js','apply/pdf/styles.css','apply/pdf/navigation.js'].map(f=>[f,execFileSync('git',['show',copyRef+':'+f])]));
    report.copyRegressionSource={ref:copyRef,files:Object.fromEntries(Object.entries(copyOldFiles).map(([f,b])=>[f,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}]))};report.copyOldRed=[];
    for(const kind of ['empty','partial','unsupported']){
      const ctx=await context(320),page=await ctx.newPage();active=page;
      for(const [file,bytes]of Object.entries(copyOldFiles)){
        const suffix=file.endsWith('index.html')?file.slice(0,-10):file;
        await ctx.route(new RegExp('/kiris-jobs/'+suffix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\?.*)?$'),r=>r.fulfill({status:200,contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript',body:bytes}));
      }
      const lang={empty:'en',partial:'ka',unsupported:'ur'}[kind];await page.goto(base+'apply/pdf/?lang='+lang);
      let observed;
      if(kind==='empty'){observed=await emptyGeometry(page);assert.ok(observed.emptyBottom>observed.coverBottom+50);assert.ok(observed.footerBottom>observed.coverBottom+50);}
      else if(kind==='partial'){observed=await page.locator('label[for="title"]').textContent();assert.equal(observed,'PDF title');}
      else{observed=await page.locator('html').getAttribute('lang');assert.equal(observed,'en');assert.equal(await page.locator('#language option[value="ur"]').count(),0);}
      await shot(page,'copy-old-'+kind+'-320');report.copyOldRed.push({kind,lang,ref:copyRef,width:320,observed,status:'expected-failure'});await close(ctx,'copy-old-'+kind);
    }
    await photoOldRed({context,base,shot,close,report,setActive:p=>{active=p}});
    await scrollbarOldRed({context,base,shot,close,report,setActive:p=>{active=p}});
    for(const width of [320,1280])for(const lang of PDF_LANGUAGES){
      const ctx=await context(width),page=await ctx.newPage();active=page;
      const appURL=base+'apply/?lang='+lang+'&recruiter=yana&location=any&src=fixture&campaign=sample&vacancy=tomatoes';
      await page.goto(appURL);await page.locator('#languageSearch').fill(lang);await page.locator(`[data-language="${lang}"]`).click();
      await page.locator('[data-recruiter="yana"]').click();
      await page.locator('#firstName').fill('QA_PDF_FIXTURE');await page.locator('#lastName').fill('NO_REAL_PERSON');
      await page.locator('#phone').fill('+99912345678');
      const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),draftKey);
      const footer=await page.locator('#footerPdf').getAttribute('href');
      assert.equal(new URL(footer).searchParams.get('lang'),lang);assert.ok(!footer.includes('QA_PDF_FIXTURE')&&!footer.includes('99912345678'));
      await page.locator('#footerPdf').click();assert.equal(await page.locator('#language').inputValue(),lang);
      assert.equal(await page.locator('h1').innerText(),titles[lang]);await fits(page);
      const copy=copyData.locales[lang];await visiblePdfCopy(page,copy);const geometry=await emptyGeometry(page);assertEmptyGeometry(geometry);
      assert.equal(await page.locator('html').getAttribute('dir'),lang==='ur'?'rtl':'ltr');
      assert.equal((await page.locator('.page-count').textContent()).trim(),'1 '+copyData.pageWord(lang,1));
      await shot(page,`pdf-${lang}-${width}`);
      const rejectedPhoto=await rejectBrokenPhoto(page,copy);await fits(page);await shot(page,`image-rejected-${lang}-${width}`);
      await page.locator('#name').fill('QA_PDF_FIXTURE <b>literal</b>');await page.locator('#phone').fill('+99912345678');await page.locator('#email').fill('fixture@example.invalid');await page.locator('#note').fill('QA · '+copy.empty);for(const field of ['citizenship','location','job'])await page.locator('#'+field).fill('QA FIXTURE');
      const acceptedPhoto=await addMixedPhotos(page,copy);
      assert.equal(await page.locator('.remove-file').getAttribute('aria-label'),copy.remove+': fixture-logo.png');
      assert.equal((await page.locator('.page-count').textContent()).trim(),'2 '+copyData.pageWord(lang,2));
      const number=await page.locator('.pdf-data dd').filter({hasText:'+99912345678'}).evaluate(n=>{const r=document.createRange(),last=document.createRange(),t=n.firstChild;r.setStart(t,0);r.setEnd(t,1);last.setStart(t,t.length-1);last.setEnd(t,t.length);return {text:n.textContent,direction:getComputedStyle(n).direction,plusX:r.getBoundingClientRect().x,lastX:last.getBoundingClientRect().x}});
      assert.equal(number.text,'+99912345678');assert.equal(number.direction,'ltr');assert.ok(number.plusX<number.lastX);
      assert.equal(await page.locator('.pdf-data b').count(),0);const filledGeometry=await page.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect();return {coverBottom:rect('.pdf-cover').bottom,footerTop:rect('.pdf-footer').top,footerBottom:rect('.pdf-footer').bottom,noteBottom:rect('.pdf-note').bottom}});assert.ok(filledGeometry.footerBottom<=filledGeometry.coverBottom+1&&filledGeometry.noteBottom<=filledGeometry.footerTop+1,JSON.stringify(filledGeometry));await fits(page);await shot(page,`pdf-filled-${lang}-${width}`);
      if(width===320)await page.pdf({path:join(out,'print-'+lang+'.pdf'),format:'A4',printBackground:true});
      const back=new URL(await page.locator('#backLink').getAttribute('href'));assert.equal(back.searchParams.get('lang'),lang);
      for(const [key,value]of [['recruiter','yana'],['location','any'],['src','fixture'],['campaign','sample'],['vacancy','tomatoes']])assert.equal(back.searchParams.get(key),value);
      assert.equal(await page.locator('#applicationBrand').getAttribute('href'),back.href);
      // A separate PDF-language preference must not change the originating application's language.
      await page.locator('#language').selectOption(lang==='en'?'pl':'en');
      assert.equal(await page.locator('#name').inputValue(),'QA_PDF_FIXTURE <b>literal</b>');assert.equal(await page.locator('#phone').inputValue(),'+99912345678');assert.equal(await page.locator('.photo-sheet img').count(),1);await page.locator('.remove-file').click();assert.equal(await page.locator('.photo-sheet img').count(),0);
      assert.equal(await page.locator('#backLink').getAttribute('href'),back.href);
      await page.locator('#backLink').click();
      await page.locator('[data-action="resume"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'),lang);
      assert.equal(await page.locator('#firstName').inputValue(),'QA_PDF_FIXTURE');assert.equal(await page.locator('#phone').inputValue(),'+99912345678');
      const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),draftKey);
      assert.equal(after.id,before.id);assert.equal(after.routeKey,before.routeKey);assert.deepEqual(after.data,before.data);
      await page.locator('#citizenship').fill('FIXTURE');await page.locator('#age').fill('30');await page.locator('#messenger').selectOption('telegram');await page.locator('[name="gender"][value="undisclosed"]').locator('..').click();await page.locator('[data-action="next"]').click();
      await page.locator('#location').selectOption('any');await page.locator('#stayDuration').selectOption('six');await page.locator('[name="physicalWork"][value="no"]').locator('..').click();await page.locator('[data-action="next"]').click();
      for(const key of ['performanceMetrics','fastPace','watchedVideos','understandsRole','longHours'])await page.locator(`[name="${key}"][value="yes"]`).locator('..').click();
      await page.locator('#consent').check();await page.locator('[data-action="next"]').click();
      assert.equal(await page.locator('.pdf-card').getAttribute('href'),await page.locator('#footerPdf').getAttribute('href'));
      const popupPromise=page.waitForEvent('popup');await page.locator('.pdf-card').click();const popup=await popupPromise;
      await popup.locator('#language').waitFor();assert.equal(await popup.locator('#language').inputValue(),lang);assert.equal(await popup.locator('h1').innerText(),titles[lang]);await popup.close();
      await fits(page);await shot(page,`review-return-${lang}-${width}`);
      report.rows.push({lang,width,passed:true,footer:true,review:true,language:true,returnRoute:true,draft:true,fits:true,noCandidateURL:true,copy:true,preview:true,direction:true,numericLTR:true,photoPreserved:true,print:true,...rejectedPhoto,...acceptedPhoto,printScope:width===320?'A4-generated':'narrow-print-covered',geometry,filledGeometry,number});await close(ctx,`${lang}-${width}`);
    }
    await scrollbarCurrent({context,base,shot,close,report,setActive:p=>{active=p},copyData});
    // Standalone URL priority, preference, denied storage, safe return, and local preview/print.
    for(const mode of ['saved','url-priority','denied','hostile-return']){
      const ctx=await context(320,mode==='denied'),page=await ctx.newPage();active=page;
      if(mode==='saved'||mode==='url-priority')await ctx.addInitScript(()=>localStorage.setItem('citronex_pdf_language','ru'));
      const suffix=mode==='url-priority'?'?lang=en':mode==='hostile-return'?'?lang=uk&returnTo=https%3A%2F%2Fevil.test%2F':'?';
      await page.goto(base+'apply/pdf/'+suffix);const expected=mode==='saved'?'ru':mode==='url-priority'?'en':mode==='hostile-return'?'uk':'pl';
      assert.equal(await page.locator('#language').inputValue(),expected);await page.locator('#name').fill('QA_PDF_FIXTURE <b>literal</b>');
      await page.locator('#photos').setInputFiles({name:'fixture-logo.png',mimeType:'image/png',buffer:await readFile('assets/icon-192.png')});
      await page.locator('.photo-sheet img').waitFor({state:'visible'});
      await page.locator('#language').selectOption('en');assert.equal(await page.locator('#name').inputValue(),'QA_PDF_FIXTURE <b>literal</b>');
      assert.equal(await page.locator('.photo-sheet img').count(),1);assert.equal(await page.locator('.pdf-data dd').innerText(),'QA_PDF_FIXTURE <b>literal</b>');assert.equal(await page.locator('.pdf-data b').count(),0);
      const back=new URL(await page.locator('#backLink').getAttribute('href'));assert.equal(back.origin,new URL(base).origin);assert.equal(back.pathname,'/kiris-jobs/apply/');
      await fits(page);await shot(page,'edge-'+mode+'-320');
      if(mode==='url-priority'){await page.pdf({path:join(out,'fixture-preview.pdf'),format:'A4',printBackground:true});}
      await page.locator('#clearButton').click();assert.equal(await page.locator('#name').inputValue(),'');assert.equal(await page.locator('.photo-sheet img').count(),0);
      report.edgeCases.push({mode,passed:true,language:expected,localPreview:true,languageSwitchPreservesDataAndFixtureImage:true,clear:true,safeReturn:true});await close(ctx,'edge-'+mode);
    }
    await photoRaceAndSize({context,base,shot,close,report,setActive:p=>{active=p},copyData});
    assertPdfRows(report.rows);assert.equal(report.copyOldRed.length,3);assert.equal(report.oldRed.length,2);assert.equal(report.edgeCases.length,4);
    assert.deepEqual(report.mutations,[]);assert.deepEqual(report.external,[]);
    assert.equal(captureStagedPublication(process.cwd(),artifact,checkout).sha256,publication.sha256);
    assert.equal(report.imageOldRed.length,2);assert.equal(report.imageRaceCases.length,2);assert.equal(report.imageSizeCases.length,2);
    assert.equal(report.scrollbarOldRed.length,2);assert.equal(report.scrollbarRows.length,20);
    report.status='passed';
  }catch(error){report.status='failed';report.error=String(error.stack||error);if(active)await active.screenshot({path:join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;
  }finally{report.finished=new Date().toISOString();await writeFile(join(out,'acceptance.json'),JSON.stringify(report,null,2));await browser?.close();await origin.stop();}
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await runPdfAcceptance();
