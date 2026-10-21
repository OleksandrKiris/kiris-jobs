const assert=require('node:assert/strict');
const test=require('node:test');
const versions={v141:{product:'HeadlessChrome/141.0.7390.37',revision:'@9f043f63b0e5b728c8d09f3e3ddfc1681a4bd58e',protocolVersion:'1.3'},v156:{product:'HeadlessChrome/156.0.8078.4',revision:'@f842f52ef39fd97b449eb27cff414bf05a98ddce',protocolVersion:'1.3'}};
const legacy='LocalStorage.DatabaseOpen',family=['InMemory','OnDisk','OnDiskExperimental'].map(x=>'Storage.LocalStorage.OpenDatabase.'+x);
const hist=(name,code=0,count=1)=>({name,count,sum:code*count,buckets:[{low:code,high:code+1,count}]});
async function capture(version,values,{detachError=false}={}) {
 const {captureBackendOpen}=await import('./backend-open-observation.mjs');const calls=[];let detached=0;
 const sample=await captureBackendOpen({browser:()=>({newBrowserCDPSession:async()=>({send:async(method,params)=>{calls.push({method,params});if(method==='Browser.getVersion')return version;const v=values[params.name];if(v instanceof Error)throw v;if(v===undefined)throw Error('Cannot find histogram: '+params.name);return {histogram:v};},detach:async()=>{detached++;if(detachError)throw Error('detach failed');}})})});
 return {sample,calls,detached};
}
test('141 measured version selects exact legacy RPC and retains literal result',async()=>{
 const {sample,calls,detached}=await capture(versions.v141,{[legacy]:hist(legacy)});
 assert.equal(sample.status,'observed');assert.equal(sample.profile,'chromium141');assert.equal(detached,1);
 assert.deepEqual(calls,[{method:'Browser.getVersion',params:{}},{method:'Browser.getHistogram',params:{name:legacy,delta:false}}]);assert.deepEqual(sample.requests[1].result,{histogram:hist(legacy)});
});
test('156 queries exactly all three pinned names once and accepts code6 without legacy coercion',async()=>{
 const {sample,calls}=await capture(versions.v156,{[family[1]]:hist(family[1],6)});
 assert.equal(sample.status,'observed');assert.equal(sample.profile,'chromium156');assert.deepEqual(calls.slice(1).map(x=>x.params.name),family);assert.equal(sample.members[1].histogram.sum,6);assert.equal(sample.members[0].status,'missing');assert.match(sample.requests[1].error.message,/Cannot find histogram/);
});
test('unknown version/revision/protocol fails closed without histogram requests',async()=>{
 for(const version of [{...versions.v156,revision:'@unknown'},{...versions.v141,product:'HeadlessChrome/142.0.0.0'},{...versions.v141,protocolVersion:'unknown'}]){
  const r=await capture(version,{});assert.equal(r.sample.status,'unavailable');assert.equal(r.calls.length,1);assert.equal(r.detached,1);
 }
});
test('all missing, unexpected transport error and malformed family retain every literal outcome',async()=>{
 for(const values of [{},{[family[1]]:Error('connection lost')},{[family[1]]:{...hist(family[1]),sum:9},[family[2]]:hist(family[2])}]){
  const r=await capture(versions.v156,values);assert.equal(r.sample.status,'unavailable');assert.equal(r.calls.length,4);assert.equal(r.sample.requests.length,4);assert.equal(r.detached,1);
 }
 const r=await capture(versions.v141,{[legacy]:hist(legacy)}, {detachError:true});assert.equal(r.sample.status,'unavailable');
});
test('strict schemas reject duplicates/overlap/impossible sums/counts/out of range without mutating raw',async()=>{
 for(const bad of [{...hist(legacy),buckets:[{low:0,high:1,count:1},{low:0,high:1,count:1}],count:2},{...hist(legacy),sum:5},{...hist(legacy),count:2,sum:1,buckets:[{low:0,high:2,count:1},{low:1,high:2,count:1}]},hist(legacy,6),{...hist(legacy),count:0,buckets:[]},{...hist(legacy),sum:-1}]){
  const raw=JSON.stringify(bad),r=await capture(versions.v141,{[legacy]:bad});assert.equal(r.sample.status,'unavailable');assert.deepEqual(r.sample.requests[1].result,{histogram:bad});assert.equal(JSON.stringify(bad),raw);
 }
});
test('stable sparse family compares only same-name positive pairs; absent both never zero',async()=>{
 const {compareBackendOpen}=await import('./backend-open-observation.mjs');const a=(await capture(versions.v156,{[family[1]]:hist(family[1])})).sample;
 const r=compareBackendOpen(a,a);assert.equal(r.status,'observed');assert.equal(r.members[1].count,0);assert.equal(r.members[0].status,'absent-both');assert.equal('count' in r.members[0],false);
});
test('positive disjoint boundaries and mixed comparable/incomparable members require FAIL',async()=>{
 const {compareBackendOpen,hasCompleteBackendOpen}=await import('./backend-open-observation.mjs');
 const a=(await capture(versions.v156,{[family[0]]:hist(family[0])})).sample,b=(await capture(versions.v156,{[family[1]]:hist(family[1])})).sample,c=(await capture(versions.v156,{[family[0]]:hist(family[0]),[family[1]]:hist(family[1])})).sample;
 assert.equal(compareBackendOpen(a,b).status,'incomparable');assert.equal(compareBackendOpen(a,c).status,'incomparable');
 const names=Array.from({length:6},(_,i)=>'observed'+i);const samples=names.flatMap(scenario=>[{scenario,phase:'before-state-reload',...a},{scenario,phase:'after-state-reload',...b}]);assert.equal(hasCompleteBackendOpen(samples,names),false);
});
test('decreasing and incoherent deltas fail; code5 positive delta remains process-wide open only',async()=>{
 const {compareBackendOpen}=await import('./backend-open-observation.mjs');const a=(await capture(versions.v141,{[legacy]:hist(legacy)})).sample,b=(await capture(versions.v141,{[legacy]:{name:legacy,count:2,sum:5,buckets:[...hist(legacy).buckets,{low:5,high:6,count:1}]}})).sample;
 assert.equal(compareBackendOpen(b,a).status,'incomparable');assert.equal(compareBackendOpen(a,b).members[0].sum,5);
 const x=(await capture(versions.v141,{[legacy]:{name:legacy,count:1,sum:0,buckets:[{low:0,high:2,count:1}]}})).sample,y=(await capture(versions.v141,{[legacy]:{name:legacy,count:2,sum:2,buckets:[{low:0,high:2,count:2}]}})).sample;assert.equal(compareBackendOpen(x,y).status,'incomparable');
});
test('gate requires six complete comparable pairs; duplicates/missing/cross-profile fail',async()=>{
 const {hasCompleteBackendOpen,compareBackendOpen}=await import('./backend-open-observation.mjs');const a=(await capture(versions.v141,{[legacy]:hist(legacy)})).sample,b=(await capture(versions.v156,{[family[1]]:hist(family[1])})).sample,names=Array.from({length:6},(_,i)=>'o'+i),samples=names.flatMap(scenario=>['before-state-reload','after-state-reload'].map(phase=>({scenario,phase,...a})));
 assert.equal(hasCompleteBackendOpen(samples,names),true);assert.equal(hasCompleteBackendOpen(samples.slice(1),names),false);assert.equal(hasCompleteBackendOpen([...samples.slice(1),samples[1]],names),false);assert.equal(compareBackendOpen(a,b).status,'incomparable');
});
