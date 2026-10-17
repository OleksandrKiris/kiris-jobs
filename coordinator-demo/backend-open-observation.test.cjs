const assert=require('node:assert/strict');
const test=require('node:test');
const histogram={name:'LocalStorage.DatabaseOpen',count:1,sum:0,buckets:[{low:0,high:1,count:1}]};
test('backend observation sends one exact cumulative browser RPC and detaches',async()=>{
  const {captureBackendOpen}=await import('./backend-open-observation.mjs');let detached=0;const calls=[];
  const result=await captureBackendOpen({browser:()=>({newBrowserCDPSession:async()=>({send:async(method,params)=>{calls.push({method,params});return {histogram};},detach:async()=>{detached++;}})})});
  assert.deepEqual(calls,[{method:'Browser.getHistogram',params:{name:'LocalStorage.DatabaseOpen',delta:false}}]);
  assert.equal(result.status,'observed');assert.equal(detached,1);assert.deepEqual(result.requests[0].result,{histogram});
});
test('unavailable, unsupported and empty backend signals fail closed without retries',async()=>{
  const {captureBackendOpen}=await import('./backend-open-observation.mjs');
  assert.equal((await captureBackendOpen({browser:()=>null})).status,'unavailable');
  for(const response of [null,{histogram:{...histogram,count:0,buckets:[]}}]){
    let calls=0,detached=0;const result=await captureBackendOpen({browser:()=>({newBrowserCDPSession:async()=>({send:async()=>{calls++;if(!response)throw Error('Cannot find histogram');return response;},detach:async()=>{detached++;}})})});
    assert.equal(result.status,'unavailable');assert.equal(calls,1);assert.equal(detached,1);
  }
});
test('backend comparison separates open samples, unchanged counts and unavailable gate',async()=>{
  const {compareBackendOpen,hasCompleteBackendOpen}=await import('./backend-open-observation.mjs');
  const a={status:'observed',histogram};
  assert.equal(compareBackendOpen(a,a).interpretation,'no-new-visible-open-sample');
  const b={status:'observed',histogram:{...histogram,count:2,sum:5,buckets:[...histogram.buckets,{low:5,high:6,count:1}]}};
  assert.deepEqual(compareBackendOpen(a,b).buckets,[{low:5,high:6,count:1}]);
  assert.equal(compareBackendOpen(b,a).status,'incomparable');assert.equal(compareBackendOpen(a,{}).status,'unavailable');
  const names=Array.from({length:6},(_,i)=>'observed'+i),samples=names.flatMap(scenario=>['before-state-reload','after-state-reload'].map(phase=>({scenario,phase,...a})));
  assert.equal(hasCompleteBackendOpen(samples,names),true);assert.equal(hasCompleteBackendOpen(samples.slice(1),names),false);
  assert.equal(hasCompleteBackendOpen([...samples.slice(1),samples[1]],names),false);
});
