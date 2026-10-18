// Browser interaction runs only in the authorized GitHub Actions environment.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const SCREENING_LANGS=['ka','az','hy','tr','uz'];
export const SCREENING_BASE='f89ba98f32c998e3b4b4261b455a03651837974a';
export const SCREENING_KEYS=['draftFound','resumeDraft','discardDraft','trustLabel','trustShort','trustNoCv','trustControl','languageLead','recruiterLead','step1Title','step1Lead','step2Title','step2Lead','step3Title','step3Lead','citizenshipHint','citizenshipPlaceholder','gender','stayDuration','physicalWork','physicalDetails','physicalDetailsHint','workNoteTitle','workNote','performanceMetrics','performanceMetricsHint','fastPace','watchedVideos','understandsRole','longHours','longHoursHint','yesShort','noShort','copyRow','rowCopied','copyFailed','sectionAvailability','sectionExperience','sectionExpectations'];
export function applyLocales(ref='') {
  const scope=vm.createContext({window:{},console,URL,Intl,Object});
  for(const file of ['i18n-core','i18n-caucasus-central','i18n-asia','i18n-extra','i18n-mobile','translations']) {
    const path='apply/'+file+'.js';
    vm.runInContext(ref?execFileSync('git',['show',ref+':'+path]).toString():readFileSync(path,'utf8'),scope,{filename:path});
  }
  return JSON.parse(JSON.stringify(scope.window.CITRONEX_SIMPLE_I18N));
}
export function assertScreeningCopy(i18n) {
  for(const lang of SCREENING_LANGS) {
    const locale=i18n.locales[lang];
    for(const key of SCREENING_KEYS) {assert.ok(locale[key]?.trim(),lang+':'+key);assert.notEqual(locale[key],i18n.locales.en[key],lang+':English fallback:'+key);}
    for(const group of ['gender','stayDurations']) {
      assert.deepEqual(Object.keys(locale.options[group]),Object.keys(i18n.locales.en.options[group]));
      for(const [key,value] of Object.entries(locale.options[group]))assert.notEqual(value,i18n.locales.en.options[group][key],lang+':'+group+':'+key);
    }
    assert.notEqual(locale.options.locations.any,i18n.locales.en.options.locations.any);
  }
  assert.equal(Object.keys(i18n.locales).length,20);
  for(const [lang,locale] of Object.entries(i18n.locales)) {
    assert.ok(locale.footerNotice?.includes('GitHub'),lang+':footer missing');
    assert.ok(locale.footerPrivacyLabel?.trim(),lang+':privacy label');
    if(lang!=='en')assert.notEqual(locale.footerPrivacyLabel,i18n.locales.en.footerPrivacyLabel);
    if(lang!=='pl')assert.notEqual(locale.footerNotice,i18n.locales.pl.footerNotice);
    if(lang!=='en')assert.notEqual(locale.footerNotice,i18n.locales.en.footerNotice);
  }
}
const flags=['steps','labels','options','conditional','answers','review','back','resumed','fits','painted','noDelivery'];
export function assertScreeningRows(rows) {
  assert.equal(rows?.length,10);
  assert.deepEqual(rows.map(r=>r.width+':'+r.lang).sort(),[320,1280].flatMap(w=>SCREENING_LANGS.map(l=>w+':'+l)).sort());
  for(const row of rows){assert.equal(row.status,'passed');for(const key of flags)assert.equal(row[key],true,`${row.lang}:${row.width}:${key}`);}
}
async function checkScreen(page,locale,step,reportDir,name) {
  assert.equal(await page.locator('h1').innerText(),locale['step'+step+'Title']);
  assert.equal(await page.locator('.step-heading p').innerText(),locale['step'+step+'Lead']);
  assert.equal(await page.locator('#footerNotice').innerText(),locale.footerNotice);
  assert.equal(await page.locator('#footerPrivacy').innerText(),locale.footerPrivacyLabel);
  const state=await page.evaluate(()=>{
    const panel=document.querySelector('.form-panel');const rect=panel.getBoundingClientRect();
    return {fits:document.documentElement.scrollWidth<=innerWidth+1,painted:rect.width>0&&getComputedStyle(panel).opacity==='1'};
  });
  assert.ok(state.fits&&state.painted,JSON.stringify(state));
  await page.screenshot({path:join(reportDir,name+'.png'),fullPage:true});
}
export async function acceptApplyScreening({context,base,reportDir,report,active}) {
  assert.equal(process.env.GITHUB_ACTIONS,'true');
  const i18n=applyLocales();assertScreeningCopy(i18n);report.applyScreening=[];report.applyScreeningOldRed=[];
  const old={};for(const f of ['index.html','app.js','translations.js'])old[f]=execFileSync('git',['show',SCREENING_BASE+':apply/'+f]);
  report.applyScreeningRegression={base:SCREENING_BASE,files:Object.fromEntries(Object.entries(old).map(([f,b])=>[f,createHash('sha256').update(b).digest('hex')]))};
  for(const width of [320,1280]) {
    const before=await context({width,height:900});const previous=await before.newPage();active(previous);
    await before.route('**/apply/',r=>r.fulfill({status:200,contentType:'text/html',body:old['index.html']}));
    for(const f of ['app.js','translations.js'])await before.route('**/apply/'+f+'?*',r=>r.fulfill({status:200,contentType:'text/javascript',body:old[f]}));
    await previous.goto(base+'apply/');await previous.locator('[data-language="ka"]').click();await previous.locator('[data-recruiter="yana"]').click();
    assert.equal(await previous.locator('html').getAttribute('lang'),'ka');assert.equal(await previous.locator('h1').innerText(),'Contact details');
    assert.ok((await previous.locator('[name="gender"][value="female"]').locator('..').innerText()).includes('Woman'));
    await previous.screenshot({path:join(reportDir,`apply-screening-old-${width}.png`),fullPage:true});
    report.applyScreeningOldRed.push({width,lang:'ka',status:'expected-failure',heading:'Contact details',base:SCREENING_BASE});await before.close();
    for(const lang of SCREENING_LANGS) {
      const ctx=await context({width,height:900});const page=await ctx.newPage();active(page);const l=i18n.locales[lang];
      await ctx.tracing.start({screenshots:true,snapshots:true,sources:false});
      try {
        await page.goto(base+'apply/');await page.locator(`[data-language="${lang}"]`).click();
        assert.equal(await page.locator('.opening-copy p').innerText(),l.recruiterLead);
        await page.locator('[data-recruiter="yana"]').click();
        await checkScreen(page,l,1,reportDir,`apply-screening-${lang}-${width}-step1`);
        assert.ok((await page.locator('#candidateForm').innerText()).includes(l.gender));
        assert.equal(await page.locator('#citizenship').getAttribute('placeholder'),l.citizenshipPlaceholder);
        const gender=await page.locator('[name="gender"]').evaluateAll(nodes=>nodes.map(n=>n.parentElement.querySelector('span:not([class])')?.textContent));
        assert.deepEqual(gender,Object.values(l.options.gender));
        await page.locator('#firstName').fill('QA');await page.locator('#lastName').fill('FIXTURE');await page.locator('#phone').fill('+99912345678');
        await page.locator('#messenger').selectOption('telegram');await page.locator('#citizenship').fill('FIXTURE');await page.locator('#age').fill('30');
        await page.locator('[name="gender"][value="undisclosed"]').locator('..').click();await page.locator('[data-action="next"]').click();
        await page.locator('[data-action="next"]').click();assert.equal(await page.locator('.field-error').count(),3);
        await page.locator('#location').selectOption('any');await page.locator('#stayDuration').selectOption('six');
        assert.deepEqual(await page.locator('#stayDuration option').allTextContents(),[l.selectOption,...Object.values(l.options.stayDurations)]);
        await page.locator('[name="physicalWork"][value="yes"]').locator('..').click();assert.ok(await page.locator('#physicalDetails').isVisible());
        await page.locator('[data-action="next"]').click();assert.equal(await page.locator('#physicalDetails-error').innerText(),l.required);
        await page.locator('#physicalDetails').fill('QA FIXTURE');
        await checkScreen(page,l,2,reportDir,`apply-screening-${lang}-${width}-step2`);
        await page.locator('[data-action="next"]').click();await page.locator('[data-action="next"]').click();assert.equal(await page.locator('.field-error').count(),6);
        for(const [field,key] of [['performanceMetrics','performanceMetrics'],['fastPace','fastPace'],['watchedVideos','watchedVideos'],['understandsRole','understandsRole'],['longHours','longHours']]) {
          const section=page.locator('.screening-question').filter({has:page.locator(`[name="${field}"]`)});
          assert.ok((await section.innerText()).includes(l[key]));
          assert.deepEqual(await section.locator('.choice-icon').allTextContents(),[l.yesShort,l.noShort]);
          await page.locator(`[name="${field}"][value="no"]`).check();
        }
        // Anonymous fixture only: this checkbox remains local. The send/copy actions are never used.
        await page.locator('#consent').check();await checkScreen(page,l,3,reportDir,`apply-screening-${lang}-${width}-step3`);
        await page.locator('[data-action="next"]').click();assert.equal(await page.locator('h1').innerText(),l.reviewTitle);
        assert.deepEqual(await page.locator('.review-section h2').allTextContents(),[l.sectionCandidate,l.sectionContact,l.sectionAvailability,l.sectionExperience,l.sectionExpectations]);
        assert.equal(await page.locator('[data-action="copy"]').innerText(),l.copyRow);
        const review=await page.locator('.review-sections').innerText();for(const v of ['QA','FIXTURE','+99912345678',l.options.gender.undisclosed,l.options.stayDurations.six,l.options.locations.any,'QA FIXTURE',l.options.yesNo.no])assert.ok(review.includes(v),v);
        assert.ok(await page.locator('[data-action="send"]').isVisible());
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        await page.screenshot({path:join(reportDir,`apply-screening-${lang}-${width}-review.png`),fullPage:true});
        await page.locator('[data-action="edit"]').click();await page.locator('[data-action="back"]').click();
        assert.equal(await page.locator('#physicalDetails').inputValue(),'QA FIXTURE');
        await page.locator('[name="physicalWork"][value="no"]').locator('..').click();assert.equal(await page.locator('#physicalDetails').count(),0);
        await page.locator('[data-action="back"]').click();assert.equal(await page.locator('#firstName').inputValue(),'QA');
        await page.reload();assert.equal(await page.locator('.draft-box strong').innerText(),l.draftFound);assert.equal(await page.locator('[data-action="resume"]').innerText(),l.resumeDraft);assert.equal(await page.locator('[data-action="discard"]').innerText(),l.discardDraft);await page.locator('[data-action="resume"]').click();
        assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.equal(await page.locator('#lastName').inputValue(),'FIXTURE');
        assert.ok(await page.locator('[name="gender"][value="undisclosed"]').isChecked());
        report.applyScreening.push({lang,width,status:'passed',...Object.fromEntries(flags.map(k=>[k,true]))});
      } finally {await ctx.tracing.stop({path:join(reportDir,`apply-screening-${lang}-${width}.zip`)});await ctx.close();}
    }
  }
  assertScreeningRows(report.applyScreening);
}
