import {test} from 'node:test';
import assert from 'node:assert/strict';
import {combineScreening,SCREENING_PROOF_KEYS} from './screening-phase.mjs';
import {FLOW_LANGS} from './apply-screening.mjs';
const expected={head:'a'.repeat(40),base:'b'.repeat(40),checkout:'c'.repeat(40),publicationSHA256:'d'.repeat(64)};
function input(){return {status:'passed',phase:'apply-screening',...expected,...Object.fromEntries(SCREENING_PROOF_KEYS.map(k=>[k,[]])),applyScreening:[320,1280].flatMap(width=>FLOW_LANGS.map(lang=>({lang,width,status:'passed',...Object.fromEntries(['steps','labels','options','conditional','answers','review','back','resumed','fits','painted','iconsOneLine','progressOneLine','direction','phoneLTR','noDelivery'].map(k=>[k,true]))})))}}
const full={status:'passed',screeningExecutionMode:'separate-required'};
test('separate report retains all40 current flows and attributed original proof',()=>{const v=combineScreening(full,input(),null,expected);assert.equal(v.applyScreening.length,40);assert.equal(v.screeningExecution.rawCoreReport,'acceptance.json');assert.equal(v.screeningExecution.childDeadlineSeconds,300);});
test('timeout/failure cannot accept a passed stale screening JSON',()=>{for(const err of [{code:'ETIMEDOUT'},{status:1}])assert.throws(()=>combineScreening(full,input(),err,expected));});
test('mismatched head, base, checkout or publication rejects screening',()=>{for(const k of Object.keys(expected)){const s=input();s[k]='wrong';assert.throws(()=>combineScreening(full,s,null,expected));}});
test('missing regression, failed process, missing or duplicate flow cannot be hidden by aggregation',()=>{for(const mutate of [s=>delete s.applyTailOldRed,s=>s.status='failed',s=>s.applyScreening.pop(),s=>s.applyScreening[1]=s.applyScreening[0]]){const s=input();mutate(s);assert.throws(()=>combineScreening(full,s,null,expected));}});
