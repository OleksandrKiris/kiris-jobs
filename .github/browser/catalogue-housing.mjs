// CI-only browser execution; expected wording was personally verified on published48b.
// No contacts, submissions, account changes or replacement map URLs.
import assert from 'node:assert/strict';
import {join} from 'node:path';
export const HOUSING_LABELS = {
  "pl": {
    "buttons": [
      "Zamknij",
      "Poprzednie zdjęcie",
      "Następne zdjęcie"
    ],
    "dialog": "Zakwaterowanie i zdjęcia",
    "counter": "Zdjęcie {current} z {total}"
  },
  "ru": {
    "buttons": [
      "Закрыть",
      "Предыдущее фото",
      "Следующее фото"
    ],
    "dialog": "Жильё и фотографии",
    "counter": "Фото {current} из {total}"
  },
  "uk": {
    "buttons": [
      "Закрити",
      "Попереднє фото",
      "Наступне фото"
    ],
    "dialog": "Житло та фотографії",
    "counter": "Фото {current} з {total}"
  },
  "en": {
    "buttons": [
      "Close",
      "Previous photo",
      "Next photo"
    ],
    "dialog": "Accommodation and photos",
    "counter": "Photo {current} of {total}"
  },
  "az": {
    "buttons": [
      "Bağla",
      "Əvvəlki foto",
      "Növbəti foto"
    ],
    "dialog": "Yaşayış yeri və fotolar",
    "counter": "Foto {current} / {total}"
  },
  "ka": {
    "buttons": [
      "დახურვა",
      "წინა ფოტო",
      "შემდეგი ფოტო"
    ],
    "dialog": "საცხოვრებელი და ფოტოები",
    "counter": "ფოტო {current} / {total}"
  },
  "id": {
    "buttons": [
      "Tutup",
      "Foto sebelumnya",
      "Foto berikutnya"
    ],
    "dialog": "Akomodasi dan foto",
    "counter": "Foto {current} dari {total}"
  },
  "es": {
    "buttons": [
      "Cerrar",
      "Foto anterior",
      "Foto siguiente"
    ],
    "dialog": "Alojamiento y fotos",
    "counter": "Foto {current} de {total}"
  },
  "fil": {
    "buttons": [
      "Isara",
      "Nakaraang larawan",
      "Susunod na larawan"
    ],
    "dialog": "Tirahan at mga larawan",
    "counter": "Larawan {current} sa {total}"
  },
  "ne": {
    "buttons": [
      "बन्द गर्नुहोस्",
      "अघिल्लो फोटो",
      "अर्को फोटो"
    ],
    "dialog": "आवास र फोटोहरू",
    "counter": "फोटो {current} / {total}"
  },
  "hy": {
    "buttons": [
      "Փակել",
      "Նախորդ լուսանկարը",
      "Հաջորդ լուսանկարը"
    ],
    "dialog": "Կացարան և լուսանկարներ",
    "counter": "Լուսանկար {current} / {total}"
  }
};
export const HOUSING_GALLERIES = [
  {id:'banana-warehouse-poland',place:'Pruszcz Gdański',total:8},
  {id:'banana-warehouse-hungary',place:'Budapest',total:8},
  {id:'banana-warehouse-belgium',place:'Belgium',total:7}
];
export function assertHousingControls(rows){
  const expected=[320,1280].flatMap(width=>HOUSING_GALLERIES.flatMap(g=>Object.keys(HOUSING_LABELS).map(lang=>`${width}:${g.id}:${lang}`))).sort();
  assert.ok(Array.isArray(rows),'Housing controls matrix is required');
  assert.deepEqual(rows.map(r=>`${r.width}:${r.id}:${r.lang}`).sort(),expected,'Housing matrix must contain exactly66 unique current cases');
  for(const r of rows){
    const g=HOUSING_GALLERIES.find(g=>g.id===r.id),labels=HOUSING_LABELS[r.lang];
    assert.equal(r.status,'passed');assert.equal(r.place,g.place);assert.equal(r.total,g.total);
    assert.equal(r.dialog,labels.dialog);assert.equal(r.counter,labels.counter.replace('{current}','1').replace('{total}',g.total));
    assert.deepEqual(r.buttons.map(b=>b.label),labels.buttons);
    assert.ok(r.buttons.every(b=>b.w>0&&b.h>0&&b.x>=0&&b.y>=0&&b.x+b.w<=r.width+1&&b.y+b.h<=900+1),'Housing controls must fit the actual viewport');
    assert.equal(r.overflow,false);assert.equal(r.image.complete,true);assert.ok(r.image.width>0);
    assert.equal(r.image.alt,g.place+' · 1');
    assert.deepEqual(r.keys,{next:g.place+' · 2',last:g.place+' · '+g.total,wrap:g.place+' · 1',reverseWrap:g.place+' · '+g.total,home:g.place+' · 1'});
    assert.equal(r.focusReturned,true);assert.equal(r.backLang,r.lang);
  }
}
export async function acceptHousingControls({context,base,reportDir,report,active}){
  assert.equal(process.env.GITHUB_ACTIONS,'true','Use the authorized Actions runner');
  report.housingControls=[];report.housingReturns=[];
  for(const width of [320,1280]){
    const ctx=await context({width,height:900}),page=await ctx.newPage(),errors=[];
    active(page);page.on('pageerror',e=>errors.push(e.message));
    await ctx.tracing.start({screenshots:true,snapshots:true,sources:false});
    try{
      for(const g of HOUSING_GALLERIES){
        await page.goto(base+'vacancies/'+g.id+'/?lang=pl');
        await page.locator(`[data-share-vacancy="${g.id}"]`).waitFor({state:'attached'});
        for(const [lang,labels] of Object.entries(HOUSING_LABELS)){
          await page.locator('.language-switcher-button').click();
          await page.locator(`[data-language-option="${lang}"]`).click();
          await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);
          assert.equal(await page.locator('.language-switcher-button').getAttribute('aria-expanded'),'false');
          const trigger=page.locator('.housing-grid a').first();
          await trigger.click();await page.locator('#housing-lightbox[open]').waitFor();
          await page.waitForFunction(()=>{const img=document.querySelector('[data-housing-lightbox-image]');return img.complete&&img.naturalWidth>0;});
          const row=await page.evaluate(()=>({lang:document.documentElement.lang,width:innerWidth,
            place:document.querySelector('[data-housing-lightbox-title]').textContent,
            dialog:document.querySelector('#housing-lightbox').getAttribute('aria-label'),
            counter:document.querySelector('[data-housing-lightbox-counter]').textContent,
            buttons:[...document.querySelectorAll('#housing-lightbox button')].map(el=>{const r=el.getBoundingClientRect();return{label:el.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height};}),
            image:{alt:document.querySelector('[data-housing-lightbox-image]').alt,complete:document.querySelector('[data-housing-lightbox-image]').complete,width:document.querySelector('[data-housing-lightbox-image]').naturalWidth},
            overflow:document.documentElement.scrollWidth>innerWidth+1,
            backLang:new URL(document.querySelector('#direct-vacancy-back').href).searchParams.get('lang')}));
          assert.equal(row.width,width);assert.equal(row.lang,lang);assert.equal(row.place,g.place);
          row.keys={};
          for(const [key,name,index] of [['ArrowRight','next',2],['End','last',g.total],['ArrowRight','wrap',1],['ArrowLeft','reverseWrap',g.total],['Home','home',1]]){
            await page.keyboard.press(key);
            row.keys[name]=await page.locator('[data-housing-lightbox-image]').getAttribute('alt');
            assert.equal(row.keys[name],g.place+' · '+index);
          }
          await page.waitForFunction(()=>{const img=document.querySelector('[data-housing-lightbox-image]');return img.complete&&img.naturalWidth>0;});
          await page.screenshot({path:join(reportDir,`housing-${width}-${g.id}-${lang}.png`)});
          await page.keyboard.press('Escape');await page.locator('#housing-lightbox[open]').waitFor({state:'hidden'});
          row.focusReturned=await trigger.evaluate(el=>el===document.activeElement);
          Object.assign(row,{id:g.id,total:g.total,status:'passed'});report.housingControls.push(row);
        }
        // Actual visible Back link, not only a query-string inspection.
        await page.locator('#direct-vacancy-back').click();
        await page.locator('#job-grid[aria-busy="false"]').waitFor({state:'attached'});
        await page.waitForFunction(()=>document.documentElement.lang==='hy');
        assert.equal(new URL(page.url()).searchParams.get('lang'),'hy');
        report.housingReturns.push({width,id:g.id,lang:'hy',status:'passed'});
      }
      assert.deepEqual(errors,[]);
      report.results.push({scenario:'three remaining housing galleries: visible language picker, eleven translations, keyboard wrap/Home/End/Escape and actual language-safe Back',width,status:'passed',cases:33});
    }finally{
      await ctx.tracing.stop({path:join(reportDir,`housing-${width}-trace.zip`)});await ctx.close();active(null);
    }
  }
  assertHousingControls(report.housingControls);
  assert.equal(report.housingReturns.length,6);
}
