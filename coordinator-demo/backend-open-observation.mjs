// Test-only backend metadata. Never reads or mutates DOM storage data.
const name='LocalStorage.DatabaseOpen';
const valid=h=>h?.name===name&&Number.isSafeInteger(h.count)&&h.count>0&&
  Number.isSafeInteger(h.sum)&&Array.isArray(h.buckets)&&h.buckets.length>0&&
  h.buckets.every(b=>Number.isSafeInteger(b.low)&&Number.isSafeInteger(b.high)&&b.high>b.low&&
    Number.isSafeInteger(b.count)&&b.count>0)&&
  h.buckets.reduce((n,b)=>n+b.count,0)===h.count;

export async function captureBackendOpen(context) {
  const sample={status:'unavailable',requests:[],transport:{attached:false,detached:false}};
  let session;
  try {
    const browser=context.browser();
    if(!browser)throw Error('Browser-level CDP session unavailable');
    session=await browser.newBrowserCDPSession();sample.transport.attached=true;
    const request={method:'Browser.getHistogram',params:{name,delta:false}};
    sample.requests.push(request);
    try {request.result=await session.send(request.method,request.params);}
    catch(error){request.error={name:error.name,message:error.message};throw error;}
    sample.histogram=request.result.histogram;
    if(!valid(sample.histogram))throw Error('Backend open histogram absent or invalid');
    sample.status='observed';
  } catch(error){sample.status='unavailable';sample.error={name:error.name,message:error.message};}
  finally {
    if(session)try {await session.detach();sample.transport.detached=true;}
    catch(error){sample.status='unavailable';sample.transport.error={name:error.name,message:error.message};}
  }
  return sample;
}

export function compareBackendOpen(before,after) {
  if(before?.status!=='observed'||after?.status!=='observed'||!valid(before.histogram)||!valid(after.histogram))return {status:'unavailable'};
  const a=before.histogram,b=after.histogram;
  const counts=h=>new Map(h.buckets.map(x=>[`${x.low}:${x.high}`,x.count]));
  const aa=counts(a),bb=counts(b),keys=new Set([...aa.keys(),...bb.keys()]);
  const buckets=[...keys].map(key=>{const [low,high]=key.split(':').map(Number);return {low,high,count:(bb.get(key)||0)-(aa.get(key)||0)};});
  if(b.count<a.count||b.sum<a.sum||buckets.some(x=>x.count<0))return {status:'incomparable',reason:'Cumulative counts decreased'};
  return {status:'observed',count:b.count-a.count,sum:b.sum-a.sum,buckets:buckets.filter(x=>x.count),
    interpretation:b.count===a.count?'no-new-visible-open-sample':'new-process-wide-backend-open-samples',
    limitation:'Not per KEY/origin; OK includes memory/recovery; no commit/load result or durability proof'};
}

export function hasCompleteBackendOpen(samples,names) {
  return names.length===6&&samples.length===12&&names.every(scenario=>
    ['before-state-reload','after-state-reload'].every(phase=>{
      const found=samples.filter(x=>x.scenario===scenario&&x.phase===phase);
      return found.length===1&&found[0].status==='observed'&&valid(found[0].histogram);
    }));
}
