import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('apply/pdf/images.js','utf8');
function api(extra={}){const context={window:{},AbortController,setTimeout,clearTimeout,...extra};vm.runInNewContext(source,context);return context.window.PRIMSERV_PDF_IMAGES}
const photo=(name='logo.png',type='image/png',size=192)=>({name,type,size});
const dimensions={width:192,height:192};
function harness(decode=async()=>dimensions){let number=0;const revoked=[],changes=[];let queue;queue=api().create({decode,createURL:()=>`blob:fixture-${++number}`,revokeURL:u=>revoked.push(u),onChange:()=>changes.push({pending:queue.pending,files:queue.files.length,errors:queue.errors.length})});return {queue,revoked,changes}}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}

test('a page is added only after successful image decoding, with pending state first',async()=>{
  const gate=deferred(),h=harness(()=>gate.promise);const task=h.queue.add([photo()]);assert.equal(h.queue.files.length,0);assert.equal(h.queue.pending,1);
  gate.resolve(dimensions);await task;assert.equal(h.queue.files.length,1);assert.equal(h.queue.pending,0);assert.equal(h.queue.errors.length,0);assert.deepEqual(h.revoked,[]);assert.equal(h.changes[0].pending,1);
});
test('mixed selection retains good photos, rejects corrupt bytes/nonphotos/oversize and releases failed URLs',async()=>{
  const h=harness(async u=>{if(u==='blob:fixture-2')throw new Error('corrupt bytes');return dimensions});
  await h.queue.add([photo(),photo('broken.png'),photo('data.txt','text/plain'),photo('huge.png','image/png',20*1048576+1),photo('unknown.PNG','')]);
  assert.equal(h.queue.files.length,2);assert.equal(h.queue.errors.length,3);assert.deepEqual([...h.queue.errors].map(x=>x.reason),['unreadable','unreadable','size']);assert.deepEqual(h.revoked,['blob:fixture-2']);assert.equal(h.queue.pending,0);
});
test('clear cancels a pending decode and late resolution cannot resurrect a page or counter',async()=>{
  const gate=deferred();let signal;const h=harness((u,o)=>{signal=o.signal;return gate.promise});const task=h.queue.add([photo('old.png'),photo('not-started.png')]);h.queue.clear();assert.equal(signal.aborted,true);assert.equal(h.queue.pending,0);assert.deepEqual(h.revoked,['blob:fixture-1']);gate.resolve(dimensions);await task;assert.equal(h.queue.files.length,0);assert.equal(h.queue.pending,0);assert.equal(h.queue.errors.length,0);assert.deepEqual(h.revoked,['blob:fixture-1']);
});
test('a new selection after clear stays independent of a rejected old decode',async()=>{
  const old=deferred();let first=true;const h=harness(()=>{if(first){first=false;return old.promise}return Promise.resolve(dimensions)});const stale=h.queue.add([photo('old.png')]);h.queue.clear();await h.queue.add([photo('new.png')]);old.reject(new Error('old failure'));await stale;assert.equal(h.queue.files.length,1);assert.equal(h.queue.files[0].file.name,'new.png');assert.equal(h.queue.errors.length,0);assert.equal(h.queue.pending,0);
});
test('remove and clear release only their owned URLs, with safe invalid removal',async()=>{
  const h=harness();await h.queue.add([photo('one.png'),photo('two.png')]);h.queue.remove(-1);h.queue.remove(9);h.queue.remove(0);assert.equal(h.queue.files.length,1);assert.deepEqual(h.revoked,['blob:fixture-1']);h.queue.clear();h.queue.clear();assert.deepEqual(h.revoked,['blob:fixture-1','blob:fixture-2']);assert.equal(h.queue.files.length,0);
});
test('20MiB boundary and supported browser-decoded HEIC remain available, zero dimensions are rejected',async()=>{
  const h=harness(async u=>u==='blob:fixture-3'?{width:0,height:0}:dimensions);await h.queue.add([photo('exact.png','image/png',20*1048576),photo('native.heic','image/heic'),photo('empty.png')]);assert.equal(h.queue.files.length,2);assert.equal(h.queue.errors.length,1);assert.equal(h.queue.errors[0].reason,'unreadable');assert.deepEqual(h.revoked,['blob:fixture-3']);
});
test('native decoder rejects load errors and aborts and detaches handlers after success',async()=>{
  let image;class FakeImage{constructor(){image=this;this.naturalWidth=12;this.naturalHeight=8}set src(v){this.value=v}get src(){return this.value}}
  const d=api({Image:FakeImage}).decodeImage;let task=d('blob:good');image.onload();assert.equal((await task).width,12);assert.equal(image.onload,null);assert.equal(image.onerror,null);
  task=d('blob:bad');image.onerror();await assert.rejects(task,/Unreadable/);assert.equal(image.value,'');
  const c=new AbortController();task=d('blob:aborted',{signal:c.signal});c.abort();await assert.rejects(task,/cancelled/);assert.equal(image.value,'');
});
test('decoder timeout releases the image and reports a failure without waiting forever',async()=>{
  let timer,image,cleared=false;class FakeImage{constructor(){image=this}set src(v){this.value=v}}
  const d=api({Image:FakeImage,setTimeout:fn=>{timer=fn;return 7},clearTimeout:id=>{if(id===7)cleared=true}}).decodeImage;
  const task=d('blob:never-loaded');timer();await assert.rejects(task,/timed out/);assert.equal(image.value,'');assert.equal(image.onload,null);assert.equal(cleared,true);
});
