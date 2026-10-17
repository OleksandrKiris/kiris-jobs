// Read-only test observation. No DOM/localStorage evaluation or storage mutation.
const nonempty=value=>typeof value==='string'&&value.length>0;
const valid=sample=>sample?.status==='observed'&&
  ['product','protocolVersion','targetId','storageKey'].every(k=>nonempty(sample.identity?.[k]));

export async function captureStorageIdentity(context,page) {
  const sample={status:'unavailable',requests:[],transport:{attached:false,detached:false}};
  let session;
  const send=async(method,params={})=>{
    const request={method,params};sample.requests.push(request);
    try {const result=await session.send(method,params);request.result=result;return result;}
    catch(error){request.error={name:error.name,message:error.message};throw error;}
  };
  try {
    session=await context.newCDPSession(page);sample.transport.attached=true;
    const version=await send('Browser.getVersion');
    const tree=await send('Page.getFrameTree');
    const frame=tree.frameTree?.frame;
    if(!nonempty(frame?.id))throw Error('Main frame identity unavailable');
    const target=await send('Target.getTargetInfo');
    const key=await send('Storage.getStorageKeyForFrame',{frameId:frame.id});
    sample.identity={product:version.product,protocolVersion:version.protocolVersion,
      targetId:target.targetInfo?.targetId,browserContextId:target.targetInfo?.browserContextId??null,
      frameId:frame.id,loaderId:frame.loaderId,url:frame.url,securityOrigin:frame.securityOrigin,
      storageKey:key.storageKey};
    sample.status='observed';
    if(!valid(sample))throw Error('Required reported identity field unavailable');
  } catch(error) {sample.status='unavailable';sample.error={name:error.name,message:error.message};}
  finally {
    if(session)try {await session.detach();sample.transport.detached=true;}
    catch(error){sample.status='unavailable';sample.transport.error={name:error.name,message:error.message};}
  }
  return sample;
}

export function compareStorageIdentity(before,after) {
  if(!valid(before)||!valid(after))return 'unavailable';
  const a=before.identity,b=after.identity;
  if(a.product!==b.product||a.protocolVersion!==b.protocolVersion)return 'incomparable-version';
  if(a.targetId!==b.targetId)return 'different-reported-target';
  if(a.browserContextId!==b.browserContextId)return 'different-reported-context-metadata';
  return a.storageKey===b.storageKey?'same-reported-target-and-storage-key':'different-reported-storage-key';
}

export function hasCompleteIdentity(samples,names) {
  const expected=names.flatMap(name=>['before-state-reload','after-state-reload'].map(phase=>name+':'+phase));
  return expected.length>0&&samples.length===expected.length&&samples.every(valid)&&
    expected.every(key=>samples.filter(x=>x.scenario+':'+x.phase===key).length===1);
}
