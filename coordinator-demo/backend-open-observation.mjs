// Test-only metadata: no DOM storage access/mutation. Exact source-supported profiles.
const profiles=Object.freeze({
 chromium141:Object.freeze({product:'HeadlessChrome/141.0.7390.37',revision:'9f043f63b0e5b728c8d09f3e3ddfc1681a4bd58e',max:6,names:Object.freeze(['LocalStorage.DatabaseOpen'])}),
 chromium156:Object.freeze({product:'HeadlessChrome/156.0.8078.4',revision:'f842f52ef39fd97b449eb27cff414bf05a98ddce',max:7,names:Object.freeze(['InMemory','OnDisk','OnDiskExperimental'].map(x=>'Storage.LocalStorage.OpenDatabase.'+x))})
});
function select(version) {
 return Object.keys(profiles).find(key=>version?.protocolVersion==='1.3'&&version.product===profiles[key].product&&
   version.revision?.replace(/^@/,'')===profiles[key].revision);
}
function coherent(buckets,count,sum,maxCode) {
 let total=0,min=0,max=0,previousHigh=-1;
 for(const b of [...buckets].sort((a,b)=>a.low-b.low)) {
  if(!Number.isSafeInteger(b.low)||!Number.isSafeInteger(b.high)||b.low<0||b.high>maxCode||b.high<=b.low||b.low<previousHigh||!Number.isSafeInteger(b.count)||b.count<=0)return false;
  previousHigh=b.high;total+=b.count;min+=b.low*b.count;max+=(b.high-1)*b.count;
  if(![total,min,max].every(Number.isSafeInteger))return false;
 }
 return total===count&&sum>=min&&sum<=max;
}
const valid=(h,name,max)=>h?.name===name&&Number.isSafeInteger(h.count)&&h.count>0&&Number.isSafeInteger(h.sum)&&Array.isArray(h.buckets)&&h.buckets.length>0&&h.buckets.every(b=>b&&typeof b==='object')&&coherent(h.buckets,h.count,h.sum,max);
function supported(sample) {
 const key=select(sample?.version),profile=profiles[key];
 return sample?.status==='observed'&&key===sample.profile&&profile&&Array.isArray(sample.members)&&sample.members.length===profile.names.length&&
  profile.names.every((name,i)=>sample.members[i]?.name===name&&
   (sample.members[i].status==='missing'||sample.members[i].status==='observed'&&valid(sample.members[i].histogram,name,profile.max)))&&sample.members.some(m=>m.status==='observed');
}
export async function captureBackendOpen(context) {
 const sample={status:'unavailable',requests:[],members:[],transport:{attached:false,detached:false}};
 let session;
 const send=async(method,params={})=>{
  const request={method,params};sample.requests.push(request);
  try {request.result=await session.send(method,params);return request.result;}
  catch(error){request.error={name:error.name,message:error.message};throw error;}
 };
 try {
  const browser=context.browser();if(!browser)throw Error('Browser-level CDP session unavailable');
  session=await browser.newBrowserCDPSession();sample.transport.attached=true;
  sample.version=await send('Browser.getVersion');sample.profile=select(sample.version);
  const profile=profiles[sample.profile];if(!profile)throw Error('Unsupported measured browser profile');
  for(const name of profile.names) {
   const member={name,status:'unavailable'};sample.members.push(member);
   try {
    const result=await send('Browser.getHistogram',{name,delta:false});member.histogram=result.histogram;
    member.status=valid(member.histogram,name,profile.max)?'observed':'malformed';
   } catch(error){
    member.error={name:error.name,message:error.message};
    // Only the explicit absent-histogram error denotes a sparse missing member.
    member.status=error.message.endsWith('Cannot find histogram: '+name)?'missing':'unavailable';
   }
  }
  sample.status='observed';if(!supported(sample))throw Error('Required backend open family unavailable or malformed');
 } catch(error){sample.status='unavailable';sample.error={name:error.name,message:error.message};}
 finally {
  if(session)try {await session.detach();sample.transport.detached=true;}
  catch(error){sample.status='unavailable';sample.transport.error={name:error.name,message:error.message};}
 }
 return sample;
}
function compareMember(a,b,max) {
 if(a.status==='missing'&&b.status==='missing')return {name:a.name,status:'absent-both'};
 if(a.status!=='observed'||b.status!=='observed')return {name:a.name,status:'incomparable',reason:'No same-name positive pair'};
 const aa=new Map(a.histogram.buckets.map(x=>[`${x.low}:${x.high}`,x.count])),bb=new Map(b.histogram.buckets.map(x=>[`${x.low}:${x.high}`,x.count]));
 const buckets=[...new Set([...aa.keys(),...bb.keys()])].map(key=>{const [low,high]=key.split(':').map(Number);return {low,high,count:(bb.get(key)||0)-(aa.get(key)||0)};});
 const count=b.histogram.count-a.histogram.count,sum=b.histogram.sum-a.histogram.sum;
 if(count<0||sum<0||buckets.some(x=>x.count<0)||!coherent(buckets.filter(x=>x.count),count,sum,max))return {name:a.name,status:'incomparable',reason:'Decreased or incoherent cumulative delta'};
 return {name:a.name,status:'observed',count,sum,buckets:buckets.filter(x=>x.count),interpretation:count===0?'no-new-visible-open-sample':'new-process-wide-backend-open-samples'};
}
export function compareBackendOpen(before,after) {
 if(!supported(before)||!supported(after))return {status:'unavailable'};
 if(before.profile!==after.profile)return {status:'incomparable',reason:'Different measured browser profiles'};
 const profile=profiles[before.profile],members=before.members.map((m,i)=>compareMember(m,after.members[i],profile.max));
 const observed=members.filter(x=>x.status==='observed').length;
 return {status:observed>0&&members.every(x=>['observed','absent-both'].includes(x.status))?'observed':'incomparable',
  profile:before.profile,members,coverage:observed===0?'none':members.some(x=>x.status==='incomparable')?'partial':'complete',
  limitation:'Process-wide open telemetry only; absent is never zero; OK includes memory/recovery; no KEY commit/load/durability proof'};
}
export function hasCompleteBackendOpen(samples,names) {
 return names.length===6&&new Set(names).size===6&&samples.length===12&&names.every(scenario=>{
  const pair=['before-state-reload','after-state-reload'].map(phase=>samples.filter(x=>x.scenario===scenario&&x.phase===phase));
  return pair.every(x=>x.length===1)&&compareBackendOpen(pair[0][0],pair[1][0]).status==='observed';
 });
}
