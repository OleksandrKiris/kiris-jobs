import assert from 'node:assert/strict';
import {assertScreeningRows} from './apply-screening.mjs';

export const SCREENING_PROOF_KEYS=['applyScreening','applyScreeningOldRed','applyScreeningIconOldRed','applyScreeningRegression','applySeaOldRed','applySeaRegressionSource','applyProgressOldRed','applyProgressRegressionSource','applyHiNeOldRed','applyHiNeRegressionSource','applyCentralOldRed','applyCentralRegressionSource','applyTailOldRed','applyTailRegressionSource','applyUrduPhoneOldRed','applyUrduCounterOldRed','applyUrduHintOldRed'];
export function combineScreening(full,screen,failure,expected){
  assert.ok(failure==null,'Screening child must exit0; timeout/failure cannot use a passed JSON');
  assert.equal(full.status,'passed');assert.equal(full.screeningExecutionMode,'separate-required');
  assert.equal(screen?.status,'passed');assert.equal(screen.phase,'apply-screening');
  for(const k of ['head','base','checkout'])assert.equal(screen[k],expected[k],'Screening '+k);
  assert.equal(screen.publicationSHA256,expected.publicationSHA256,'Exact staged publication for screening');
  assertScreeningRows(screen.applyScreening);
  const fields={};for(const k of SCREENING_PROOF_KEYS){assert.ok(Object.hasOwn(screen,k),'Missing screening proof: '+k);fields[k]=screen[k];}
  return {...full,...fields,screeningExecution:{status:'passed',phase:screen.phase,head:screen.head,base:screen.base,checkout:screen.checkout,
    publicationSHA256:screen.publicationSHA256,started:screen.started,finished:screen.finished,
    report:'screening/acceptance.json',rawCoreReport:'acceptance.json',childDeadlineSeconds:300}};
}
