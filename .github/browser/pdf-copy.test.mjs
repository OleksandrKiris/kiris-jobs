import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pdfCopy,assertPdfCopy,assertEmptyGeometry} from './pdf-copy.mjs';

test('all20 PDF languages have complete explicit visible copy, including captions formerly in English',()=>assertPdfCopy(pdfCopy()));
test('copy acceptance rejects missing language, missing caption and English placeholder fallback',()=>{
  for(const mutate of [d=>delete d.languages.ur,d=>delete d.explicit.ka.email,d=>d.explicit.si.empty=d.base.empty]){const d=pdfCopy();mutate(d);assert.throws(()=>assertPdfCopy(d));}
});
test('page counts use correct Russian and Ukrainian singular after21 and retain Polish teen rule',()=>{
  const d=pdfCopy();for(const lang of ['ru','uk']){assert.equal(d.pageWord(lang,21),d.locales[lang].pageSingular);assert.equal(d.pageWord(lang,11),d.locales[lang].pages);assert.notEqual(d.pageWord(lang,22),d.locales[lang].pages);}
  assert.equal(d.pageWord('pl',21),'stron');assert.equal(d.pageWord('pl',12),'stron');assert.equal(d.pageWord('pl',22),'strony');
});
test('empty-preview gate rejects clipped message, footer and text',()=>{
  const good={coverBottom:500,emptyBottom:440,footerTop:440,footerBottom:480,emptyHeight:100,emptyTextHeight:40};assert.doesNotThrow(()=>assertEmptyGeometry(good));
  for(const patch of [{emptyBottom:501},{footerBottom:502},{emptyTextHeight:101}])assert.throws(()=>assertEmptyGeometry({...good,...patch}));
});
