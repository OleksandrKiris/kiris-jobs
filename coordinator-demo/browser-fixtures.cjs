// Self-contained: Playwright serializes this function into each document.
function seedFixture({key, other, mode, previous}) {
  const marker='primserv:acceptance:coordinator-seeded';
  window.__coordinatorInitialStorage={raw:localStorage.getItem(key),marker:localStorage.getItem(marker)};
  if (!localStorage.getItem(marker)) {
    localStorage.setItem(other,'keep');
    const raw=mode==='corrupt'?'{broken':mode==='future'
      ?JSON.stringify({version:2,statuses:{}}):mode==='empty'?null:previous;
    // Never replace existing state if only the fixture marker is missing.
    if(raw!==null && localStorage.getItem(key)===null)localStorage.setItem(key,raw);
    localStorage.setItem(marker,'yes');
  }
  if(mode==='denied-read')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied fixture','SecurityError');}});
  if(mode==='denied-write'||mode==='denied-remove') {
    const method=mode==='denied-write'?'setItem':'removeItem';
    const original=Storage.prototype[method];
    Storage.prototype[method]=function(name,...args) {
      if(name===key)throw new DOMException('Denied fixture','SecurityError');
      return original.call(this,name,...args);
    };
  }
}
module.exports={seedFixture};
