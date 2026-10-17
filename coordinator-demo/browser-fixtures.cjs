// Self-contained: Playwright serializes this function into each document.
function seedFixture({key, other, mode, previous, observe=false}) {
  const marker='primserv:acceptance:coordinator-seeded';
  let evidence, originalGet, area;
  if(observe) {
    area=localStorage;
    originalGet=Storage.prototype.getItem;
    evidence=window.__coordinatorEvidence={observe,phase:'fixture',events:[],
      url:location.href,readyState:document.readyState,timeOrigin:performance.timeOrigin,
      initAt:performance.now(),navigation:performance.getEntriesByType('navigation')[0]?.type||'unavailable'};
    for(const operation of ['getItem','setItem','removeItem']) {
      const original=Storage.prototype[operation];
      Storage.prototype[operation]=function(name,...args) {
        try {
          const result=original.call(this,name,...args);
          if(this===area && [key,other,marker].includes(name))evidence.events.push({phase:evidence.phase,operation,key:name,args,result:result===undefined?null:result,outcome:'returned'});
          return result;
        } catch(error) {
          if(this===area)evidence.events.push({phase:evidence.phase,operation,key:name,outcome:'threw',error:error.name});
          throw error;
        }
      };
    }
    // Capture the real model, not a replacement storage or business implementation.
    let api;
    Object.defineProperty(window,'CoordinatorDemo',{configurable:true,get(){return api;},set(value){
      api=Object.freeze({...value,create(...args){
        const model=value.create(...args);window.__coordinatorObservedModel=model;
        evidence.initialModel=model.snapshot();return model;
      }});
    }});
  }
  const markerValue=localStorage.getItem(marker);
  if(observe==='preseed') {
    // The only added storage read. Report it separately; it may change timing.
    evidence.preSeedProbe={marker:markerValue,raw:originalGet.call(area,key),addedReads:1};
  }
  if (!markerValue) {
    localStorage.setItem(other,'keep');
    const raw=mode==='corrupt'?'{broken':mode==='future'
      ?JSON.stringify({version:2,statuses:{}}):mode==='empty'?null:previous;
    // Never replace existing state if only the fixture marker is missing.
    if(raw!==null && localStorage.getItem(key)===null)localStorage.setItem(key,raw);
    localStorage.setItem(marker,'yes');
  }
  if(mode==='denied-read')Object.defineProperty(window,'localStorage',{get(){
    if(evidence)evidence.events.push({phase:'app',operation:'access-localStorage',outcome:'threw',error:'SecurityError'});
    throw new DOMException('Denied fixture','SecurityError');
  }});
  if(mode==='denied-write'||mode==='denied-remove') {
    const method=mode==='denied-write'?'setItem':'removeItem';
    const original=Storage.prototype[method];
    Storage.prototype[method]=function(name,...args) {
      if(name===key){
        if(evidence)evidence.events.push({phase:'app',operation:method,key:name,outcome:'threw',error:'SecurityError'});
        throw new DOMException('Denied fixture','SecurityError');
      }
      return original.call(this,name,...args);
    };
  }
  if(evidence)evidence.phase='app';
}
function acceptanceStatus(scenarios) {
  return scenarios.length>0 && scenarios.every(x=>x.status==='passed')?'passed':'failed';
}
module.exports={seedFixture,acceptanceStatus};
