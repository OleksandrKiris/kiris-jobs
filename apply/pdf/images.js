/* Decode local photos before adding a printable page. No uploads or persistence. */
(()=>{'use strict';
const MAX_BYTES=20*1048576;
function decodeImage(url,{signal,timeoutMs=15000}={}){
  return new Promise((resolve,reject)=>{
    const image=new Image();let timer;
    const finish=(error)=>{
      clearTimeout(timer);image.onload=null;image.onerror=null;
      if(signal)signal.removeEventListener('abort',abort);
      if(error){image.src='';reject(error)}
      else resolve({width:image.naturalWidth,height:image.naturalHeight});
    };
    const abort=()=>finish(new Error('Image check cancelled'));
    image.onload=()=>finish(image.naturalWidth>0&&image.naturalHeight>0?null:new Error('Empty image'));
    image.onerror=()=>finish(new Error('Unreadable image'));
    if(signal?.aborted){abort();return}
    if(signal)signal.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>finish(new Error('Image check timed out')),timeoutMs);
    image.src=url;
  });
}
function create({decode=decodeImage,createURL=file=>URL.createObjectURL(file),revokeURL=url=>URL.revokeObjectURL(url),onChange=()=>{}}={}){
  let files=[],errors=[],pending=0,generation=0;
  const urls=new Set(),controllers=new Set();
  const release=url=>{if(urls.delete(url))revokeURL(url)};
  return {
    get files(){return files.slice()},get errors(){return errors.slice()},get pending(){return pending},
    async add(input){
      const selected=Array.from(input),current=generation;errors=[];pending+=selected.length;onChange();
      for(const file of selected){
        if(current!==generation)break;
        let url,controller;
        try{
          const imageType=String(file.type||'').startsWith('image/');
          const missingType=!file.type&&/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
          if(!imageType&&!missingType)throw new Error('unreadable');
          if(file.size>MAX_BYTES)throw new Error('size');
          url=createURL(file);urls.add(url);controller=new AbortController();controllers.add(controller);
          const dimensions=await decode(url,{signal:controller.signal});
          if(!dimensions||!Number.isFinite(dimensions.width)||!Number.isFinite(dimensions.height)||dimensions.width<=0||dimensions.height<=0)throw new Error('unreadable');
          if(current===generation)files.push({file,url});else release(url);
        }catch(error){
          if(url)release(url);
          if(current===generation)errors.push({name:file.name,reason:error.message==='size'?'size':'unreadable'});
        }finally{
          if(controller)controllers.delete(controller);
          if(current===generation){pending--;onChange()}
        }
      }
    },
    remove(index){if(!Number.isInteger(index)||index<0||index>=files.length)return;const [file]=files.splice(index,1);release(file.url);onChange()},
    clear(){generation++;for(const controller of controllers)controller.abort();controllers.clear();for(const url of urls)release(url);files=[];errors=[];pending=0;onChange()}
  };
}
window.PRIMSERV_PDF_IMAGES={create,decodeImage,MAX_BYTES};
})();
