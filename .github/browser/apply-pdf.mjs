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

export const PDF_LANGUAGES=['pl','uk','ru','en','ka','az','hy','tr','uz'];
const titles={pl:'Utwórz PDF',uk:'Створити PDF',ru:'Создать PDF',en:'Create PDF',ka:'PDF-ის შექმნა',az:'PDF yaradın',hy:'Ստեղծել PDF',tr:'PDF oluştur',uz:'PDF yaratish'};
const OLD='3fb5e53647a4fc025ad8fb8621308ce7f1a6e11a';
const draftKey='citronex_screening_application_v17';
export function assertPdfRows(rows){
  assert.deepEqual(rows?.map(r=>r.width+':'+r.lang).sort(),[320,1280].flatMap(w=>PDF_LANGUAGES.map(l=>w+':'+l)).sort());
  for(const r of rows)for(const k of ['passed','footer','review','language','returnRoute','draft','fits','noCandidateURL'])assert.equal(r[k],true,`${r.lang}:${r.width}:${k}`);
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
    for(const width of [320,1280])for(const lang of PDF_LANGUAGES){
      const ctx=await context(width),page=await ctx.newPage();active=page;
      const appURL=base+'apply/?lang='+lang+'&recruiter=yana&location=any&src=fixture&campaign=sample&vacancy=tomatoes';
      await page.goto(appURL);await page.locator(`[data-language="${lang}"]`).click();
      await page.locator('[data-recruiter="yana"]').click();
      await page.locator('#firstName').fill('QA_PDF_FIXTURE');await page.locator('#lastName').fill('NO_REAL_PERSON');
      await page.locator('#phone').fill('+99912345678');
      const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),draftKey);
      const footer=await page.locator('#footerPdf').getAttribute('href');
      assert.equal(new URL(footer).searchParams.get('lang'),lang);assert.ok(!footer.includes('QA_PDF_FIXTURE')&&!footer.includes('99912345678'));
      await page.locator('#footerPdf').click();assert.equal(await page.locator('#language').inputValue(),lang);
      assert.equal(await page.locator('h1').innerText(),titles[lang]);await fits(page);await shot(page,`pdf-${lang}-${width}`);
      const back=new URL(await page.locator('#backLink').getAttribute('href'));assert.equal(back.searchParams.get('lang'),lang);
      for(const [key,value]of [['recruiter','yana'],['location','any'],['src','fixture'],['campaign','sample'],['vacancy','tomatoes']])assert.equal(back.searchParams.get(key),value);
      assert.equal(await page.locator('#applicationBrand').getAttribute('href'),back.href);
      // A separate PDF-language preference must not change the originating application's language.
      await page.locator('#language').selectOption(lang==='en'?'pl':'en');
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
      report.rows.push({lang,width,passed:true,footer:true,review:true,language:true,returnRoute:true,draft:true,fits:true,noCandidateURL:true});await close(ctx,`${lang}-${width}`);
    }
    // Standalone URL priority, preference, denied storage, safe return, and local preview/print.
    for(const mode of ['saved','url-priority','denied','hostile-return']){
      const ctx=await context(320,mode==='denied'),page=await ctx.newPage();active=page;
      if(mode==='saved'||mode==='url-priority')await ctx.addInitScript(()=>localStorage.setItem('citronex_pdf_language','ru'));
      const suffix=mode==='url-priority'?'?lang=en':mode==='hostile-return'?'?lang=uk&returnTo=https%3A%2F%2Fevil.test%2F':'?';
      await page.goto(base+'apply/pdf/'+suffix);const expected=mode==='saved'?'ru':mode==='url-priority'?'en':mode==='hostile-return'?'uk':'pl';
      assert.equal(await page.locator('#language').inputValue(),expected);await page.locator('#name').fill('QA_PDF_FIXTURE <b>literal</b>');
      await page.locator('#photos').setInputFiles({name:'fixture-logo.png',mimeType:'image/png',buffer:await readFile('assets/icon-192.png')});
      await page.locator('#language').selectOption('en');assert.equal(await page.locator('#name').inputValue(),'QA_PDF_FIXTURE <b>literal</b>');
      assert.equal(await page.locator('.photo-sheet img').count(),1);assert.equal(await page.locator('.pdf-data dd').innerText(),'QA_PDF_FIXTURE <b>literal</b>');assert.equal(await page.locator('.pdf-data b').count(),0);
      const back=new URL(await page.locator('#backLink').getAttribute('href'));assert.equal(back.origin,new URL(base).origin);assert.equal(back.pathname,'/kiris-jobs/apply/');
      await fits(page);await shot(page,'edge-'+mode+'-320');
      if(mode==='url-priority'){await page.pdf({path:join(out,'fixture-preview.pdf'),format:'A4',printBackground:true});}
      await page.locator('#clearButton').click();assert.equal(await page.locator('#name').inputValue(),'');assert.equal(await page.locator('.photo-sheet img').count(),0);
      report.edgeCases.push({mode,passed:true,language:expected,localPreview:true,languageSwitchPreservesDataAndFixtureImage:true,clear:true,safeReturn:true});await close(ctx,'edge-'+mode);
    }
    assertPdfRows(report.rows);assert.equal(report.oldRed.length,2);assert.equal(report.edgeCases.length,4);
    assert.deepEqual(report.mutations,[]);assert.deepEqual(report.external,[]);
    assert.equal(captureStagedPublication(process.cwd(),artifact,checkout).sha256,publication.sha256);
    report.status='passed';
  }catch(error){report.status='failed';report.error=String(error.stack||error);if(active)await active.screenshot({path:join(out,'failure.png'),fullPage:true}).catch(()=>{});throw error;
  }finally{report.finished=new Date().toISOString();await writeFile(join(out,'acceptance.json'),JSON.stringify(report,null,2));await browser?.close();await origin.stop();}
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await runPdfAcceptance();
