import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY_LABELS,assertApplyEntry} from './apply-entry.mjs';
const valid=()=>[320,1280].flatMap(width=>Object.entries(EMPTY_LABELS).map(([lang,empty])=>({width,lang,actualLang:lang,empty,status:'passed',typing:true,cleared:true,matched:true,focusedCorrection:true,associated:true,edited:true,revalidated:true,fits:true,noSend:true})));
test('apply entry requires all40 explicit language/viewport cases',()=>{assert.doesNotThrow(()=>assertApplyEntry(valid()));for(const rows of [valid().slice(1),valid().map((r,i,a)=>i===1?a[0]:r)]) assert.throws(()=>assertApplyEntry(rows));});
test('apply entry rejects lost typing, stale errors, overflow, send state and fallback wording',()=>{for(const key of ['typing','cleared','matched','focusedCorrection','associated','edited','revalidated','fits','noSend']){const rows=valid();rows[0][key]=false;assert.throws(()=>assertApplyEntry(rows));} const rows=valid();rows.find(r=>r.lang==='ur').empty=EMPTY_LABELS.en;assert.throws(()=>assertApplyEntry(rows));});
