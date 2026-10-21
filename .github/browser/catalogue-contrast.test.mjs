import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { CONTRAST_REGRESSION, assertContrastSource, assertContrastRegressionRows, contrastRegressionStylesheet } from './catalogue-contrast.mjs';
const currentBase='f94084ee255d0cd4d7b33c45ce0f8df80c1da55c';
const rows=()=>[320,1280].map(width=>({width,base:currentBase,regressionRef:CONTRAST_REGRESSION.ref,
  stylesheetSHA256:CONTRAST_REGRESSION.sha256,status:'expected-failure-observed',button:{ratio:1.08}}));
test('post-fix event base and pre-fix contrast source are accepted as distinct identities',()=>{
  assert.notEqual(currentBase,CONTRAST_REGRESSION.ref);
  assertContrastRegressionRows(rows(),currentBase);
});
test('wrong base, moving RED source, changed bytes and fixed-contrast RED evidence are rejected',()=>{
  for(const mutate of [r=>r.base=CONTRAST_REGRESSION.ref,r=>r.regressionRef=currentBase,
    r=>r.stylesheetSHA256='0'.repeat(64),r=>r.status='passed',r=>r.button.ratio=12.84,
    r=>r.button.ratio=NaN]){
    const data=rows();mutate(data[0]);assert.throws(()=>assertContrastRegressionRows(data,currentBase));
  }
  assert.throws(()=>assertContrastRegressionRows([rows()[0]],currentBase));
  assert.throws(()=>assertContrastRegressionRows([rows()[0],rows()[0]],currentBase));
});
test('real published fixed CSS cannot replace the witnessed old stylesheet',()=>{
  // Present HEAD has the same fixed CSS as currentBase; this test needs no history fetch.
  const fixed=execFileSync('git',['show','HEAD:assets/homepage.css']);
  assert.throws(()=>assertContrastSource(fixed),/exact witnessed pre-fix/);
  assert.throws(()=>assertContrastSource(Buffer.from('truncated')));
});
test('historical network access remains CI-only',()=>{
  const before=process.env.GITHUB_ACTIONS;
  try{delete process.env.GITHUB_ACTIONS;assert.throws(()=>contrastRegressionStylesheet(),/authorized CI runner/);}
  finally{if(before===undefined)delete process.env.GITHUB_ACTIONS;else process.env.GITHUB_ACTIONS=before;}
});
