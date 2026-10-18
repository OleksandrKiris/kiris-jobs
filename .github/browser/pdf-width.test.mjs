import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertInlineFit,assertClassicGutter,assertScrollbarRows} from './pdf-width.mjs';
import {PDF_ALL_LANGUAGES} from './pdf-copy.mjs';
const geometry=()=>({innerWidth:320,clientWidth:305,scrollWidth:305,left:0,right:305,gutter:'stable',rects:['header','back','main','controls','preview','cover','footer','upload','print','clear'].map(key=>({key,left:7,right:298}))});
test('width gate uses actual client area and rejects either clipped edge or missing regions',()=>{
  assert.doesNotThrow(()=>assertInlineFit(geometry()));
  for(const change of [g=>g.scrollWidth=320,g=>g.rects[0].left=-15,g=>g.rects[1].right=319,g=>g.rects.pop(),g=>g.clientWidth=NaN,g=>g.rects[0].right=NaN]){const g=geometry();change(g);assert.throws(()=>assertInlineFit(g));}
});
test('scrollbar fixture rejects overlay, absent or implausible reserved gutter',()=>{
  assert.doesNotThrow(()=>assertClassicGutter(geometry()));
  for(const patch of [{clientWidth:320},{clientWidth:280},{gutter:'auto'}])assert.throws(()=>assertClassicGutter({...geometry(),...patch}));
});
test('scrollbar acceptance requires all20 unique languages and all three actual geometries',()=>{
  const rows=()=>PDF_ALL_LANGUAGES.map(lang=>({lang,passed:true,empty:true,rejected:true,filled:true,copy:true,preview:true,decodedPhoto:true,localOnly:true,emptyGeometry:geometry(),rejectedGeometry:geometry(),filledGeometry:geometry()}));
  assert.doesNotThrow(()=>assertScrollbarRows(rows()));assert.throws(()=>assertScrollbarRows(rows().slice(1)));
  const dup=rows();dup[1]=dup[0];assert.throws(()=>assertScrollbarRows(dup));
  for(const k of ['passed','empty','rejected','filled','copy','preview','decodedPhoto','localOnly']){const r=rows();r[0][k]=false;assert.throws(()=>assertScrollbarRows(r));}
  for(const k of ['emptyGeometry','rejectedGeometry','filledGeometry']){const r=rows();r[0][k].scrollWidth=320;assert.throws(()=>assertScrollbarRows(r));}
});
