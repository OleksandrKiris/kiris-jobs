// Serialized into a fresh browser context by the CI acceptance entry only.
function installFixture({ key, other, raw, denied }) {
  // file:// sessionStorage can change across reloads. Use the preserved test
  // sentinel in the same storage area as the record, so recovery is never undone.
  if (localStorage.getItem(other) === 'keep') return;
  localStorage.setItem(key, raw);
  localStorage.setItem(other, 'keep');
  const original = Object.fromEntries(['getItem', 'setItem', 'removeItem'].map(method => [method, Storage.prototype[method]]));
  if (denied) Storage.prototype[denied] = function (k, ...args) {
    if (this === localStorage && k === key) throw new DOMException('Test storage denial', 'SecurityError');
    return original[denied].call(this, k, ...args);
  };
  window.__shiftFixture = {
    read: k => original.getItem.call(localStorage, k),
    restore: () => { for (const method of Object.keys(original)) Storage.prototype[method] = original[method]; }
  };
}
function prepareNativeFixture({key,other,raw}) {
  if(document.readyState==='loading')throw Error('Fixture provisioning requires a ready file document');
  if(localStorage.getItem(key)!==null)throw Error('Expected a fresh owned fixture profile');
  localStorage.setItem(key,raw);
  localStorage.setItem(other,'keep');
}

// Only denial policy survives document reloads. Product values are never seeded
// here. window.name carries a test-only boolean after explicit restore(), so a
// later document does not reapply a denial that the recovery scenario removed.
function installNativeHooks({key,denied}) {
  const released='primserv:shift-fixture:denial-released';
  const original=Object.fromEntries(['getItem','setItem','removeItem'].map(method=>[method,Storage.prototype[method]]));
  if(denied && window.name!==released)Storage.prototype[denied]=function(k,...args) {
    if(this===localStorage && k===key)throw new DOMException('Test storage denial','SecurityError');
    return original[denied].call(this,k,...args);
  };
  window.__shiftFixture={
    read:k=>original.getItem.call(localStorage,k),
    restore:()=>{
      for(const method of Object.keys(original))Storage.prototype[method]=original[method];
      window.name=released;
    }
  };
}
module.exports = { installFixture, prepareNativeFixture, installNativeHooks };
