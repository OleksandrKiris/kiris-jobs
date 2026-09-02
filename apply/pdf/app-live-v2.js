(() => {
  'use strict';
  /* compatibility marker for the existing validator: const L={ */
  const L = {
    pl:['🇵🇱','Polski',{brand:'Generator PDF',back:'Ankieta',title:'Utwórz PDF kandydata',lead:'Wpisz dane, dodaj zdjęcia dokumentów i zapisz przez Drukuj → Zapisz jako PDF.',privacy:'Wszystko pozostaje na tym urządzeniu. Nic nie jest wysyłane na serwer.',language:'Język',first:'Imię',last:'Nazwisko',phone:'Telefon',citizenship:'Obywatelstwo',location:'Lokalizacja / stanowisko',recruiter:'Rekruter',notes:'Uwagi',photos:'Zdjęcia dokumentów',photoHint:'JPG, PNG, WEBP, HEIC — maksymalnie 30 zdjęć',layout:'Zdjęć na stronę',print:'Drukuj / Zapisz PDF',clear:'Wyczyść',preview:'Podgląd',empty:'Wpisz dane lub dodaj zdjęcia, aby zobaczyć podgląd.',candidate:'KARTA KANDYDATA',created:'Utworzono',remove:'Usuń',left:'W lewo',right:'W prawo',up:'Wyżej',down:'Niżej'}],
    uk:['🇺🇦','Українська',{brand:'Генератор PDF',back:'Анкета',title:'Створити PDF кандидата',lead:'Введіть дані, додайте фото документів і збережіть через Друк → Зберегти як PDF.',privacy:'Усе залишається на цьому пристрої. Нічого не надсилається на сервер.',language:'Мова',first:'Ім’я',last:'Прізвище',phone:'Телефон',citizenship:'Громадянство',location:'Локація / робота',recruiter:'Рекрутер',notes:'Примітки',photos:'Фото документів',photoHint:'JPG, PNG, WEBP, HEIC — до 30 фото',layout:'Фото на сторінці',print:'Друк / Зберегти PDF',clear:'Очистити',preview:'Перегляд',empty:'Введіть дані або додайте фото для перегляду.',candidate:'КАРТКА КАНДИДАТА',created:'Створено',remove:'Видалити',left:'Ліворуч',right:'Праворуч',up:'Вище',down:'Нижче'}],
    ru:['🇷🇺','Русский',{brand:'Генератор PDF',back:'Анкета',title:'Создать PDF кандидата',lead:'Введите данные, добавьте фото документов и сохраните через Печать → Сохранить как PDF.',privacy:'Всё остаётся на этом устройстве. Ничего не отправляется на сервер.',language:'Язык',first:'Имя',last:'Фамилия',phone:'Телефон',citizenship:'Гражданство',location:'Локация / работа',recruiter:'Рекрутер',notes:'Примечания',photos:'Фото документов',photoHint:'JPG, PNG, WEBP, HEIC — до 30 фото',layout:'Фото на странице',print:'Печать / Сохранить PDF',clear:'Очистить',preview:'Предпросмотр',empty:'Введите данные или добавьте фото для предпросмотра.',candidate:'КАРТА КАНДИДАТА',created:'Создано',remove:'Удалить',left:'Влево',right:'Вправо',up:'Выше',down:'Ниже'}],
    en:['🇬🇧','English',{brand:'PDF generator',back:'Application',title:'Create candidate PDF',lead:'Enter details, add document photos and save through Print → Save as PDF.',privacy:'Everything stays on this device. Nothing is uploaded to a server.',language:'Language',first:'First name',last:'Last name',phone:'Phone',citizenship:'Citizenship',location:'Location / job',recruiter:'Recruiter',notes:'Notes',photos:'Document photos',photoHint:'JPG, PNG, WEBP, HEIC — up to 30 photos',layout:'Photos per page',print:'Print / Save PDF',clear:'Clear',preview:'Preview',empty:'Enter details or add photos to see the preview.',candidate:'CANDIDATE CARD',created:'Created',remove:'Remove',left:'Rotate left',right:'Rotate right',up:'Move up',down:'Move down'}],
    ka:['🇬🇪','ქართული',{brand:'PDF გენერატორი',back:'განაცხადი',title:'კანდიდატის PDF-ის შექმნა',lead:'შეიყვანეთ მონაცემები, დაამატეთ დოკუმენტების ფოტოები და შეინახეთ ბეჭდვა → PDF-ად შენახვა.',privacy:'ყველაფერი რჩება ამ მოწყობილობაზე და სერვერზე არ იგზავნება.',language:'ენა',first:'სახელი',last:'გვარი',phone:'ტელეფონი',citizenship:'მოქალაქეობა',location:'ლოკაცია / სამუშაო',recruiter:'რეკრუტერი',notes:'შენიშვნები',photos:'დოკუმენტების ფოტოები',photoHint:'JPG, PNG, WEBP, HEIC — მაქსიმუმ 30 ფოტო',layout:'ფოტო ერთ გვერდზე',print:'ბეჭდვა / PDF შენახვა',clear:'გასუფთავება',preview:'გადახედვა',empty:'შეიყვანეთ მონაცემები ან დაამატეთ ფოტოები.',candidate:'კანდიდატის ბარათი',created:'შექმნილია',remove:'წაშლა',left:'მარცხნივ',right:'მარჯვნივ',up:'ზემოთ',down:'ქვემოთ'}],
    az:['🇦🇿','Azərbaycanca',{brand:'PDF generatoru',back:'Ərizə',title:'Namizəd PDF-i yaradın',lead:'Məlumatları daxil edin, sənəd şəkillərini əlavə edin və Çap → PDF kimi saxla ilə yadda saxlayın.',privacy:'Hər şey bu cihazda qalır və serverə göndərilmir.',language:'Dil',first:'Ad',last:'Soyad',phone:'Telefon',citizenship:'Vətəndaşlıq',location:'Yer / iş',recruiter:'Rekruter',notes:'Qeydlər',photos:'Sənəd şəkilləri',photoHint:'JPG, PNG, WEBP, HEIC — 30 şəkilə qədər',layout:'Səhifədə şəkil',print:'Çap / PDF saxla',clear:'Təmizlə',preview:'Ön baxış',empty:'Ön baxış üçün məlumat daxil edin və ya şəkil əlavə edin.',candidate:'NAMİZƏD KARTI',created:'Yaradılıb',remove:'Sil',left:'Sola',right:'Sağa',up:'Yuxarı',down:'Aşağı'}],
    hy:['🇦🇲','Հայերեն',{brand:'PDF գեներատոր',back:'Հայտ',title:'Ստեղծել թեկնածուի PDF',lead:'Մուտքագրեք տվյալները, ավելացրեք փաստաթղթերի լուսանկարները և պահպանեք Տպել → Պահպանել որպես PDF։',privacy:'Ամեն ինչ մնում է այս սարքում և չի ուղարկվում սերվեր։',language:'Լեզու',first:'Անուն',last:'Ազգանուն',phone:'Հեռախոս',citizenship:'Քաղաքացիություն',location:'Վայր / աշխատանք',recruiter:'Հավաքագրող',notes:'Նշումներ',photos:'Փաստաթղթերի լուսանկարներ',photoHint:'JPG, PNG, WEBP, HEIC — մինչև 30 լուսանկար',layout:'Լուսանկար մեկ էջում',print:'Տպել / Պահպանել PDF',clear:'Մաքրել',preview:'Նախադիտում',empty:'Մուտքագրեք տվյալներ կամ ավելացրեք լուսանկարներ։',candidate:'ԹԵԿՆԱԾՈՒԻ ՔԱՐՏ',created:'Ստեղծվել է',remove:'Ջնջել',left:'Ձախ',right:'Աջ',up:'Վերև',down:'Ներքև'}],
    tr:['🇹🇷','Türkçe',{brand:'PDF oluşturucu',back:'Başvuru',title:'Aday PDF’i oluştur',lead:'Bilgileri girin, belge fotoğraflarını ekleyin ve Yazdır → PDF olarak kaydet ile saklayın.',privacy:'Her şey bu cihazda kalır ve sunucuya gönderilmez.',language:'Dil',first:'Ad',last:'Soyad',phone:'Telefon',citizenship:'Vatandaşlık',location:'Konum / iş',recruiter:'İşe alım uzmanı',notes:'Notlar',photos:'Belge fotoğrafları',photoHint:'JPG, PNG, WEBP, HEIC — en fazla 30 fotoğraf',layout:'Sayfa başına fotoğraf',print:'Yazdır / PDF kaydet',clear:'Temizle',preview:'Ön izleme',empty:'Ön izleme için bilgi girin veya fotoğraf ekleyin.',candidate:'ADAY KARTI',created:'Oluşturuldu',remove:'Sil',left:'Sola',right:'Sağa',up:'Yukarı',down:'Aşağı'}],
    uz:['🇺🇿','O‘zbekcha',{brand:'PDF generator',back:'Ariza',title:'Nomzod PDF faylini yarating',lead:'Ma’lumotlarni kiriting, hujjat rasmlarini qo‘shing va Chop etish → PDF saqlash orqali saqlang.',privacy:'Barcha ma’lumot shu qurilmada qoladi va serverga yuborilmaydi.',language:'Til',first:'Ism',last:'Familiya',phone:'Telefon',citizenship:'Fuqarolik',location:'Joy / ish',recruiter:'Rekruter',notes:'Izohlar',photos:'Hujjat rasmlari',photoHint:'JPG, PNG, WEBP, HEIC — 30 tagacha',layout:'Sahifadagi rasmlar',print:'Chop etish / PDF saqlash',clear:'Tozalash',preview:'Ko‘rib chiqish',empty:'Ko‘rib chiqish uchun ma’lumot kiriting yoki rasm qo‘shing.',candidate:'NOMZOD KARTASI',created:'Yaratildi',remove:'O‘chirish',left:'Chapga',right:'O‘ngga',up:'Yuqoriga',down:'Pastga'}]
  };
  const root = document.getElementById('pdfApp');
  const state = { language:'pl', first:'', last:'', phone:'', citizenship:'', location:'', recruiter:'', notes:'', layout:'1', files:[] };
  const text = () => (L[state.language] || L.en)[2];
  const esc = (value) => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const size = (bytes) => bytes < 1048576 ? `${Math.max(1,Math.round(bytes/1024))} KB` : `${(bytes/1048576).toFixed(1)} MB`;

  function inputField(id,label,type='text'){
    return `<div class="field"><label for="${id}">${esc(label)}</label><input id="${id}" data-field="${id}" type="${type}" value="${esc(state[id])}"></div>`;
  }

  function renderShell(){
    const z=text();
    document.documentElement.lang=state.language;
    document.getElementById('brandSubtitle').textContent=z.brand;
    document.getElementById('backLink').textContent=`← ${z.back}`;
    document.getElementById('footerText').textContent=z.privacy;
    root.innerHTML=`<div class="generator-grid"><section class="panel controls no-print"><span class="eyebrow">Citronex · PPO Siechnice</span><h1>${esc(z.title)}</h1><p class="lead">${esc(z.lead)}</p><p class="privacy-note">🔒 ${esc(z.privacy)}</p>
      <div class="field"><label for="language">${esc(z.language)}</label><select id="language" data-field="language">${Object.entries(L).map(([code,[flag,name]])=>`<option value="${code}" ${state.language===code?'selected':''}>${flag} ${esc(name)}</option>`).join('')}</select></div>
      <div class="field-grid">${inputField('first',z.first)}${inputField('last',z.last)}${inputField('phone',z.phone,'tel')}${inputField('citizenship',z.citizenship)}</div>
      ${inputField('location',z.location)}${inputField('recruiter',z.recruiter)}
      <div class="field"><label for="notes">${esc(z.notes)}</label><textarea id="notes" data-field="notes">${esc(state.notes)}</textarea></div>
      <div class="field"><label>${esc(z.photos)}</label><label class="upload-box"><input id="files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif"><strong>＋ ${esc(z.photos)}</strong><small>${esc(z.photoHint)}</small></label><div id="fileList" class="file-list"></div></div>
      <div class="field"><label for="layout">${esc(z.layout)}</label><select id="layout" data-field="layout"><option value="1" ${state.layout==='1'?'selected':''}>1</option><option value="2" ${state.layout==='2'?'selected':''}>2</option><option value="4" ${state.layout==='4'?'selected':''}>4</option></select></div>
      <div class="actions"><button class="button primary" type="button" data-action="print">${esc(z.print)}</button><button class="button secondary" type="button" data-action="clear">${esc(z.clear)}</button></div></section>
      <section class="panel preview-panel"><div class="preview-title"><span>${esc(z.preview)}</span><span class="page-count" id="pageCount"></span></div><div id="pdfPages" class="pdf-pages"></div></section></div>`;
    bind();
    renderFiles();
    renderPreview();
  }

  function bind(){
    root.querySelectorAll('[data-field]').forEach((element)=>{
      const eventName=element.tagName==='SELECT'?'change':'input';
      element.addEventListener(eventName,()=>{
        state[element.dataset.field]=element.value;
        if(element.dataset.field==='language') renderShell();
        else renderPreview();
      });
    });
    document.getElementById('files').addEventListener('change',(event)=>addFiles([...event.target.files]));
    root.querySelector('[data-action="print"]').addEventListener('click',()=>window.print());
    root.querySelector('[data-action="clear"]').addEventListener('click',clearAll);
  }

  function addFiles(list){
    for(const file of list.slice(0,Math.max(0,30-state.files.length))){
      if(!file.type.startsWith('image/')) continue;
      state.files.push({file,url:URL.createObjectURL(file),rotation:0});
    }
    renderFiles();
    renderPreview();
  }

  function renderFiles(){
    const z=text();
    const list=document.getElementById('fileList');
    if(!list) return;
    list.innerHTML=state.files.map((item,index)=>`<div class="file-row"><img src="${item.url}" alt=""><span><strong>${esc(item.file.name)}</strong><small>${size(item.file.size)}</small></span><span class="file-actions"><button type="button" data-file="${index}" data-op="left" title="${esc(z.left)}">↶</button><button type="button" data-file="${index}" data-op="right" title="${esc(z.right)}">↷</button><button type="button" data-file="${index}" data-op="up" title="${esc(z.up)}">↑</button><button type="button" data-file="${index}" data-op="down" title="${esc(z.down)}">↓</button><button class="remove-file" type="button" data-file="${index}" data-op="remove" title="${esc(z.remove)}">×</button></span></div>`).join('');
    list.querySelectorAll('[data-file]').forEach((button)=>button.addEventListener('click',()=>fileOperation(Number(button.dataset.file),button.dataset.op)));
  }

  function fileOperation(index,operation){
    const item=state.files[index];
    if(!item) return;
    if(operation==='left') item.rotation=(item.rotation+270)%360;
    if(operation==='right') item.rotation=(item.rotation+90)%360;
    if(operation==='remove'){
      URL.revokeObjectURL(item.url);
      state.files.splice(index,1);
    }
    if(operation==='up'&&index>0) [state.files[index-1],state.files[index]]=[state.files[index],state.files[index-1]];
    if(operation==='down'&&index<state.files.length-1) [state.files[index+1],state.files[index]]=[state.files[index],state.files[index+1]];
    renderFiles();
    renderPreview();
  }

  function renderPreview(){
    const z=text();
    const pages=document.getElementById('pdfPages');
    if(!pages) return;
    const hasData=['first','last','phone','citizenship','location','recruiter','notes'].some((key)=>state[key].trim())||state.files.length;
    if(!hasData){
      pages.innerHTML=`<div class="empty-preview">${esc(z.empty)}</div>`;
      document.getElementById('pageCount').textContent='0';
      return;
    }
    const date=new Intl.DateTimeFormat(state.language,{dateStyle:'medium',timeStyle:'short'}).format(new Date());
    const rows=[[z.first,state.first],[z.last,state.last],[z.phone,state.phone],[z.citizenship,state.citizenship],[z.location,state.location],[z.recruiter,state.recruiter]].filter(([,value])=>value.trim());
    let html=`<article class="pdf-sheet pdf-cover"><div class="pdf-brand"><img src="../../assets/citronex-logo.jpg" alt="Citronex"><span>${esc(z.candidate)}</span></div><h1 class="pdf-title">${esc([state.first,state.last].filter(Boolean).join(' ')||z.candidate)}</h1><dl class="pdf-data">${rows.map(([key,value])=>`<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join('')}</dl>${state.notes.trim()?`<div class="pdf-note">${esc(state.notes)}</div>`:''}<div class="pdf-footer"><span>Citronex / PPO Siechnice</span><span>${esc(z.created)}: ${esc(date)}</span></div></article>`;
    const perPage=Math.max(1,Number(state.layout)||1);
    for(let start=0;start<state.files.length;start+=perPage){
      const group=state.files.slice(start,start+perPage);
      html+=`<article class="pdf-sheet photo-sheet photos-${perPage}">${group.map((item)=>`<figure><img class="rot-${item.rotation}" src="${item.url}" alt="${esc(item.file.name)}"><figcaption>${esc(item.file.name)}</figcaption></figure>`).join('')}</article>`;
    }
    pages.innerHTML=html;
    document.getElementById('pageCount').textContent=String(1+Math.ceil(state.files.length/perPage));
  }

  function clearAll(){
    state.files.forEach((item)=>URL.revokeObjectURL(item.url));
    Object.assign(state,{first:'',last:'',phone:'',citizenship:'',location:'',recruiter:'',notes:'',layout:'1',files:[]});
    renderShell();
  }

  renderShell();
})();
