// Runs only inside the authorized Actions browser; fresh isolated contexts and no sends.
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const EMPTY_LABELS = {
  "pl": "Nie znaleziono języka.",
  "uk": "Мову не знайдено.",
  "ru": "Язык не найден.",
  "en": "No matching language was found.",
  "ka": "ენა ვერ მოიძებნა.",
  "az": "Dil tapılmadı.",
  "hy": "Լեզուն չի գտնվել։",
  "tr": "Dil bulunamadı.",
  "uz": "Til topilmadi.",
  "bn": "কোনো ভাষা পাওয়া যায়নি।",
  "fil": "Walang nahanap na wika.",
  "hi": "कोई भाषा नहीं मिली।",
  "id": "Bahasa tidak ditemukan.",
  "kk": "Тіл табылмады.",
  "ky": "Тил табылган жок.",
  "ne": "भाषा फेला परेन।",
  "si": "භාෂාවක් හමු නොවීය.",
  "tg": "Забон ёфт нашуд.",
  "ur": "کوئی زبان نہیں ملی۔",
  "vi": "Không tìm thấy ngôn ngữ."
};
export function assertApplyEntry(rows) {
  assert.equal(rows?.length,40,'Exactly40 apply entry cases');
  assert.deepEqual(rows.map(r=>`${r.width}:${r.lang}`).sort(),[320,1280].flatMap(width=>Object.keys(EMPTY_LABELS).map(lang=>`${width}:${lang}`)).sort());
  for(const r of rows) {
    assert.equal(r.status,'passed'); assert.equal(r.actualLang,r.lang);
    assert.equal(r.empty,EMPTY_LABELS[r.lang]);
    for(const key of ['typing','cleared','matched','focusedCorrection','associated','edited','revalidated','fits','noSend']) assert.equal(r[key],true,`${r.width}:${r.lang}:${key}`);
  }
}
export async function acceptApplyEntry({context,base,reportDir,report,active}) {
  assert.equal(process.env.GITHUB_ACTIONS,'true');
  report.applyEntry=[]; report.applyOldRed=[];
  // Pin the observed faulty implementation; the moving PR base is not evidence.
  const oldRef='3a0faf0419ad76efbe189771f4cf62d4303550fe';
  const oldApp=execFileSync('git',['show',oldRef+':apply/app.js']);
  report.applyRegressionSource={ref:oldRef,path:'apply/app.js',sha256:createHash('sha256').update(oldApp).digest('hex')};
  for(const width of [320,1280]) {
    const oldCtx=await context({width,height:900});
    await oldCtx.route('**/apply/app.js?*',route=>route.fulfill({status:200,contentType:'text/javascript',body:oldApp}));
    const oldPage=await oldCtx.newPage(); active(oldPage);
    await oldPage.goto(base+'apply/'); await oldPage.locator('#languageSearch').click(); await oldPage.keyboard.type('ne');
    const oldSearch=await oldPage.evaluate(()=>({value:document.querySelector('#languageSearch').value,focused:document.activeElement.id}));
    assert.equal(oldSearch.value,'n'); assert.notEqual(oldSearch.focused,'languageSearch');
    await oldPage.locator('#languageSearch').fill(''); await oldPage.locator('[data-language="ru"]').click();
    await oldPage.locator('[data-recruiter="yana"]').click(); await oldPage.locator('[data-action="next"]').click();
    assert.equal(await oldPage.locator('.field-error').count(),7);
    assert.notEqual(await oldPage.evaluate(()=>document.activeElement.id),'firstName');
    assert.equal(await oldPage.locator('#firstName').getAttribute('aria-invalid'),null);
    await oldPage.screenshot({path:join(reportDir,`apply-old-red-${width}.png`)});
    report.applyOldRed.push({width,status:'expected-failure',search:oldSearch,errors:7,unassociated:true});
    await oldCtx.close();
    for(const lang of Object.keys(EMPTY_LABELS)) {
      const ctx=await context({width,height:900}); const page=await ctx.newPage(); active(page);
      await page.goto(base+'apply/'); await page.locator('[data-action="toggle-languages"]').click();
      await page.locator(`[data-language="${lang}"]`).click();
      await page.locator('[data-action="language"]').click();
      const input=page.locator('#languageSearch'); await input.click(); await page.keyboard.type('ne');
      const typing=await input.inputValue()==='ne' && await page.evaluate(()=>document.activeElement.id)==='languageSearch';
      assert.ok(typing,'Incremental typing must retain focus');
      await input.press('Backspace'); assert.equal(await input.inputValue(),'n'); await input.press('e');
      assert.equal(await input.inputValue(),'ne');
      await input.fill('zzzzzz'); const empty=await page.locator('.language-grid [role="status"]').innerText();
      await input.fill('');
      // Clearing restores the user's expanded list, rather than silently collapsing it.
      const expandedRestored=await page.locator('[data-language]').count()===20 && await page.locator('[data-action="toggle-languages"]').isVisible();
      await page.locator('[data-action="toggle-languages"]').click();
      const cleared=expandedRestored && await page.locator('[data-language]').count()===9;
      await input.fill(lang); const matched=await page.locator(`[data-language="${lang}"]`).isVisible();
      await page.locator(`[data-language="${lang}"]`).click();
      await page.locator('[data-recruiter="yana"]').click(); await page.locator('[data-action="next"]').click();
      await page.waitForFunction(()=>{
        const field=document.getElementById('firstName'); const rect=field?.getBoundingClientRect();
        return document.activeElement===field && rect.top>=0 && rect.bottom<=innerHeight;
      });
      assert.equal(await page.locator('.field-error').count(),7);
      const associated=await page.evaluate(()=>[...document.querySelectorAll('.invalid,input[aria-invalid="true"]')].every(n=>n.getAttribute('aria-invalid')==='true' && document.getElementById(n.getAttribute('aria-describedby'))?.textContent));
      await page.screenshot({path:join(reportDir,`apply-required-${lang}-${width}.png`)});
      await page.locator('#firstName').fill('QA Fixture');
      const edited=await page.locator('#firstName-error').count()===0 && await page.locator('#firstName').getAttribute('aria-invalid')===null;
      await page.locator('#firstName').fill(''); await page.locator('[data-action="next"]').click();
      const revalidated=await page.locator('#firstName-error').count()===1;
      const dom=await page.evaluate(()=>({actualLang:document.documentElement.lang, fits:document.documentElement.scrollWidth<=innerWidth+1, noSend:!document.querySelector('[data-action="send"]')}));
      report.applyEntry.push({lang,width,status:'passed',empty,typing,cleared,matched,focusedCorrection:true,associated,edited,revalidated,...dom});
      await ctx.close();
    }
  }
  assertApplyEntry(report.applyEntry);
}
