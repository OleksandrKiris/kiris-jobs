import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const scope=vm.createContext({window:{},URL});
vm.runInContext(readFileSync('apply/pdf/navigation.js','utf8'),scope);
const {toPdf,toApplication}=scope.window.PRIMSERV_PDF_NAVIGATION;
const base='https://example.test/kiris-jobs/apply/';

test('all20 application languages survive the separate PDF round trip',()=>{
  for(const lang of ['pl','uk','ru','en','ka','az','hy','tr','uz','id','fil','vi','hi','ne','ky','tg','kk','bn','ur','si']) {
    const pdf=new URL(toPdf(base,'./pdf/',lang));
    assert.equal(pdf.pathname,'/kiris-jobs/apply/pdf/');assert.equal(pdf.searchParams.get('lang'),lang);
    const back=new URL(toApplication(pdf.href,'en'));
    assert.equal(back.href,base+'?lang='+lang);
  }
});
test('return retains only bounded routing metadata, never candidate fields or fragment',()=>{
  const pdf=new URL(toPdf(base+'?lang=pl&recruiter=yana&location=any&src=fixture&campaign=sample&vacancy=tomatoes&partner=fixture&group=sample&phone=SECRET&name=SECRET#SECRET','pdf/','ru'));
  assert.deepEqual([...pdf.searchParams.keys()],['lang','returnTo']);assert.ok(!pdf.href.includes('SECRET'));
  const back=new URL(toApplication(pdf.href,'en'));
  for(const [k,v]of [['recruiter','yana'],['location','any'],['src','fixture'],['campaign','sample'],['vacancy','tomatoes'],['partner','fixture'],['group','sample'],['lang','ru']])assert.equal(back.searchParams.get(k),v);
  assert.equal(back.hash,'');assert.equal(back.searchParams.size,8);
});
test('foreign, script, credential and sibling return destinations cannot redirect',()=>{
  for(const requested of ['https://evil.test/kiris-jobs/apply/?lang=ru','//evil.test/kiris-jobs/apply/','javascript:alert(1)','https://user:pass@example.test/kiris-jobs/apply/','../elsewhere/','/kiris-jobs/apply/pdf/','https://[bad']) {
    const pdf=new URL('pdf/',base);pdf.searchParams.set('returnTo',requested);
    assert.equal(toApplication(pdf.href,'uk'),base+'?lang=uk');
  }
});
test('standalone PDF returns in selected language and ignores unknown return fields',()=>{
  assert.equal(toApplication(base+'pdf/?lang=ru','ru'),base+'?lang=ru');
  const pdf=new URL(base+'pdf/');pdf.searchParams.set('returnTo','/kiris-jobs/apply/?lang=en&phone=SECRET&src='+('x'.repeat(121)));
  assert.equal(toApplication(pdf.href,'pl'),base+'?lang=en&src='+('x'.repeat(120)));
});
test('invalid language values cannot inject additional URL parameters',()=>{
  for(const value of ['en&phone=SECRET','EN','<script>','',null]) {
    assert.equal(new URL(toPdf(base,'pdf/',value)).searchParams.get('lang'),'en');
    assert.equal(toApplication(base+'pdf/',value),base+'?lang=en');
  }
  assert.throws(()=>toPdf(base,'https://evil.test/','en'));
});

import {assertPdfRows,PDF_LANGUAGES} from './apply-pdf.mjs';
const rows=()=>[320,1280].flatMap(width=>PDF_LANGUAGES.map(lang=>({width,lang,passed:true,footer:true,review:true,language:true,returnRoute:true,draft:true,fits:true,noCandidateURL:true,copy:true,preview:true,direction:true,numericLTR:true,photoPreserved:true,print:true})));
test('PDF acceptance rejects missing or duplicate language-width cases',()=>{assert.doesNotThrow(()=>assertPdfRows(rows()));assert.throws(()=>assertPdfRows(rows().slice(1)));const a=rows();a[1]=a[0];assert.throws(()=>assertPdfRows(a));});
test('PDF acceptance rejects lost draft, route, language, review, layout or privacy proof',()=>{for(const key of ['passed','footer','review','language','returnRoute','draft','fits','noCandidateURL','copy','preview','direction','numericLTR','photoPreserved','print']){const a=rows();a[0][key]=false;assert.throws(()=>assertPdfRows(a));}});
