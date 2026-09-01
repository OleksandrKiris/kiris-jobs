(() => {
  'use strict';

  const VERSION = '14.0.3';
  const te = new TextEncoder();
  const td = new TextDecoder();
  const RECRUITERS = Object.freeze([
    { id:'yana', name:'Yana Radushynska', email:'yana.radushynska@pposiechnice.pl', phone:'+48 797 066 987', initials:'YR' },
    { id:'yuliia', name:'Yuliia Korniienko', email:'yuliia.korniienko@pposiechnice.pl', phone:'+48 506 845 667', initials:'YK' },
    { id:'fariz', name:'Fariz Injaev', email:'fariz.injaev@pposiechnice.pl', phone:'+48 504 165 739', initials:'FI' },
    { id:'oleksandr', name:'Oleksandr Kiris', email:'oleksandr.kiris@pposiechnice.pl', phone:'+48 502 251 384', initials:'OK' },
    { id:'maksym', name:'Maksym Saliuk', email:'maksym.saliuk@pposiechnice.pl', phone:'+48 506 845 637', initials:'MS' },
    { id:'anastasiia', name:'Anastasiia Derepa', email:'anastasiia.derepa@citronex.pl', phone:'+48 797 684 159', initials:'AD' }
  ]);
  const LANGUAGES = Object.freeze([
    ['pl','🇵🇱','Polski','Polish'],['uk','🇺🇦','Українська','Ukrainian'],['ru','🇷🇺','Русский','Russian'],['en','🇬🇧','English','English'],
    ['ka','🇬🇪','ქართული','Georgian'],['az','🇦🇿','Azərbaycan dili','Azerbaijani'],['hy','🇦🇲','Հայերեն','Armenian'],['tr','🇹🇷','Türkçe','Turkish'],
    ['uz','🇺🇿','O‘zbekcha','Uzbek'],['ky','🇰🇬','Кыргызча','Kyrgyz'],['tg','🇹🇯','Тоҷикӣ','Tajik'],['kk','🇰🇿','Қазақша','Kazakh'],
    ['hi','🇮🇳','हिन्दी','Hindi'],['bn','🇧🇩','বাংলা','Bengali'],['ne','🇳🇵','नेपाली','Nepali'],['ur','🇵🇰','اردو','Urdu'],
    ['si','🇱🇰','සිංහල','Sinhala'],['fil','🇵🇭','Filipino','Filipino'],['id','🇮🇩','Bahasa Indonesia','Indonesian'],['vi','🇻🇳','Tiếng Việt','Vietnamese']
  ]);
  const DOCUMENT_CATEGORIES = Object.freeze([
    ['passport-main','Paszport — strona ze zdjęciem'],['passport-pages','Paszport — pozostałe strony'],['identity-card','Dowód / ID'],
    ['visa','Wiza'],['residence-front','Karta pobytu — przód'],['residence-back','Karta pobytu — tył'],['driver-license','Prawo jazdy'],['cv','CV'],['other','Inny dokument']
  ]);
  const TASKS = Object.freeze([
    ['sorting','Sortowanie produktów'],['packing','Pakowanie produktów'],['quality','Kontrola jakości'],['greenhouse','Prace w szklarni'],
    ['harvest','Zbiór warzyw i owoców'],['warehouse','Prace magazynowe'],['scanner','Obsługa skanera magazynowego'],['production','Obsługa linii produkcyjnej'],
    ['cleaning','Utrzymanie czystości'],['forklift','Obsługa wózka widłowego'],['driving','Prowadzenie pojazdów'],['technical','Prace techniczne']
  ]);
  const MAP = Object.freeze({
    filledBy:{ candidate:'Kandydat', representative:'Przedstawiciel / partner' },
    gender:{ female:'Kobieta', male:'Mężczyzna', other:'Inna / nie podano' },
    boolean:{ yes:'Tak', no:'Nie', depends:'Zależy' },
    legal:{ none:'Brak polskich dokumentów', visa:'Polska wiza', residence:'Karta pobytu', pesel:'PESEL UKR / ochrona czasowa', other:'Inny dokument', unknown:'Nie wiem' },
    location:{ siechnice:'Siechnice', ryczywol:'Ryczywół / Kozienice', bogatynia:'Bogatynia', zgorzelec:'Zgorzelec', pruszcz:'Pruszcz Gdański', any:'Dowolna lokalizacja' },
    job:{ greenhouse:'Praca w szklarni', sorting:'Sortowanie i pakowanie', warehouse:'Magazyn i logistyka', production:'Produkcja', cleaning:'Sprzątanie', driver:'Kierowca', technical:'Praca techniczna', other:'Inna praca' },
    start:{ now:'Od zaraz', d7:'W ciągu 7 dni', d14:'W ciągu 14 dni', d30:'W ciągu 30 dni', later:'Później' },
    source:{ facebook:'Facebook', instagram:'Instagram', tiktok:'TikTok', telegram:'Telegram', whatsapp:'WhatsApp', viber:'Viber', referral:'Polecenie', recruiter:'Rekruter / agencja', other:'Inne' }
  });
  const COLUMNS = Object.freeze([
    ['applicationId','ID zgłoszenia'],['candidateKey','Klucz kandydata'],['version','Wersja'],['createdAt','Data zgłoszenia'],['updatedAt','Ostatnia aktualizacja'],
    ['language','Język'],['recruiterId','ID rekrutera'],['recruiterName','Rekruter'],['recruiterEmail','E-mail rekrutera'],['filledBy','Ankietę wypełnia'],
    ['representativeName','Przedstawiciel / partner'],['groupCode','Kod grupy / partnera'],['firstName','Imię'],['lastName','Nazwisko'],['latinName','Imię i nazwisko łacinką'],
    ['birthDate','Data urodzenia'],['gender','Płeć'],['phone','Telefon'],['messenger','Komunikator'],['email','E-mail kandydata'],
    ['citizenship','Obywatelstwo'],['country','Kraj pobytu'],['city','Miasto'],['inPoland','W Polsce'],['legalStatus','Dokument pobytowy'],
    ['legalExpiry','Ważny do'],['peselUkr','PESEL UKR'],['biometricPassport','Paszport biometryczny'],['location','Preferowana lokalizacja'],['job','Rodzaj pracy'],
    ['start','Gotowość rozpoczęcia'],['shifts','Praca zmianowa'],['housing','Potrzebne zakwaterowanie'],['transport','Potrzebny transport'],['duration','Planowany okres pracy'],
    ['restrictions','Ograniczenia zdrowotne / fizyczne'],['clothingSize','Rozmiar odzieży'],['shoeSize','Rozmiar obuwia'],['experienceCompany','Firma'],['experienceCountry','Kraj doświadczenia'],
    ['experienceRole','Stanowisko'],['experienceFrom','Doświadczenie od'],['experienceTo','Doświadczenie do'],['tasks','Obowiązki'],['education','Wykształcenie'],
    ['languagesSkills','Znajomość języków'],['drivingLicense','Prawo jazdy'],['certificates','Certyfikaty'],['source','Źródło'],['sourceDetails','Dokładne źródło'],
    ['status','Status'],['interviewDate','Data rozmowy wideo'],['nextContact','Następny kontakt'],['motivation','Motywacja'],['polishLevel','Język polski — ocena'],
    ['recruiterNotes','Notatka rekrutera'],['documentsCount','Liczba dokumentów'],['packageName','Nazwa pakietu']
  ]);

  const xml = (value) => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const clean = (value, fallback = '') => String(value ?? '').trim() || fallback;
  const mapValue = (group, value) => MAP[group]?.[value] || clean(value);
  const categoryLabel = (value) => DOCUMENT_CATEGORIES.find(([key]) => key === value)?.[1] || 'Inny dokument';
  const taskLabel = (value) => TASKS.find(([key]) => key === value)?.[1] || value;
  const recruiterFor = (id) => RECRUITERS.find((item) => item.id === id) || RECRUITERS[0];
  const formatBytes = (bytes) => bytes < 1048576 ? `${Math.max(1,Math.ceil(bytes/1024))} KB` : `${(bytes/1048576).toFixed(1)} MB`;
  const stamp = () => new Date().toISOString();
  const applicationId = () => `APP-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0,6)}`;
  const filePart = (value, fallback = 'NA') => clean(value, fallback).normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu,'_').replace(/^_+|_+$/g,'').slice(0,60) || fallback;

  async function candidateKey(data) {
    const raw = `${clean(data.phone).replace(/\D/g,'')}|${clean(data.birthDate)}`;
    if (!raw.replace('|','')) return '';
    const bytes = await crypto.subtle.digest('SHA-256', te.encode(raw));
    return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2,'0')).join('').slice(0,20).toUpperCase();
  }

  function packageBase(data) {
    return `${filePart(data.lastName,'Candidate')}_${filePart(data.firstName,'')}_${filePart(data.birthDate,'DOB')}_${filePart(data.applicationId,'APP')}`.replace(/_+/g,'_');
  }

  function candidateRow(data, documents = []) {
    const recruiter = recruiterFor(data.recruiterId);
    const values = {
      ...data,
      recruiterName:recruiter.name,recruiterEmail:recruiter.email,
      filledBy:mapValue('filledBy',data.filledBy),gender:mapValue('gender',data.gender),inPoland:mapValue('boolean',data.inPoland),
      legalStatus:mapValue('legal',data.legalStatus),biometricPassport:mapValue('boolean',data.biometricPassport),location:mapValue('location',data.location),
      job:mapValue('job',data.job),start:mapValue('start',data.start),shifts:mapValue('boolean',data.shifts),housing:mapValue('boolean',data.housing),
      transport:mapValue('boolean',data.transport),tasks:(data.tasks || []).map(taskLabel).join('; '),source:mapValue('source',data.source),
      status:data.status || 'NEW',documentsCount:documents.length,packageName:`${packageBase(data)}.zip`
    };
    return COLUMNS.map(([key]) => values[key] ?? '');
  }

  function textCell(value, style = 0) {
    return `<c t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  }
  function colName(index) {
    let result = '';
    for (let value = index + 1; value; value = Math.floor((value - 1) / 26)) result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
    return result;
  }
  function sheetXml(rows) {
    const body = rows.map((row,rowIndex) => `<row r="${rowIndex+1}">${row.map((cell,colIndex) => `<c r="${colName(colIndex)}${rowIndex+1}" t="inlineStr" s="${rowIndex===0?1:0}"><is><t xml:space="preserve">${xml(cell)}</t></is></c>`).join('')}</row>`).join('');
    const maxCol = colName(Math.max(0,...rows.map((row) => row.length - 1)));
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${maxCol}${Math.max(1,rows.length)}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="${Math.max(1,COLUMNS.length)}" width="18" customWidth="1"/></cols><sheetData>${body}</sheetData><autoFilter ref="A1:${maxCol}${Math.max(1,rows.length)}"/></worksheet>`;
  }

  function u16(value) { const a = new Uint8Array(2); new DataView(a.buffer).setUint16(0,value,true); return a; }
  function u32(value) { const a = new Uint8Array(4); new DataView(a.buffer).setUint32(0,value>>>0,true); return a; }
  function join(chunks) { const size = chunks.reduce((sum,item) => sum + item.length,0); const out = new Uint8Array(size); let offset=0; chunks.forEach((item) => { out.set(item,offset); offset += item.length; }); return out; }
  const CRC_TABLE = (() => Array.from({length:256},(_,n) => { let c=n; for(let k=0;k<8;k++) c=(c&1)?0xEDB88320^(c>>>1):c>>>1; return c>>>0; }))();
  function crc32(bytes) { let crc=0xFFFFFFFF; for(const byte of bytes) crc=CRC_TABLE[(crc^byte)&255]^(crc>>>8); return (crc^0xFFFFFFFF)>>>0; }
  function dosDate(date = new Date()) { const year=Math.max(1980,date.getFullYear()); return {time:(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1),date:((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate()}; }

  class ZipWriter {
    constructor(){ this.entries=[]; }
    async add(name, content){
      const bytes = content instanceof Uint8Array ? content : new Uint8Array(await (content instanceof Blob ? content : new Blob([content])).arrayBuffer());
      this.entries.push({name:String(name).replaceAll('\\','/'),bytes,crc:crc32(bytes),date:new Date()});
    }
    blob(type='application/zip'){
      const locals=[]; const centrals=[]; let offset=0;
      for(const entry of this.entries){
        const name=te.encode(entry.name); const dt=dosDate(entry.date);
        const local=join([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),u32(entry.crc),u32(entry.bytes.length),u32(entry.bytes.length),u16(name.length),u16(0),name,entry.bytes]);
        locals.push(local);
        centrals.push(join([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),u32(entry.crc),u32(entry.bytes.length),u32(entry.bytes.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));
        offset += local.length;
      }
      const central=join(centrals); const end=join([u32(0x06054b50),u16(0),u16(0),u16(this.entries.length),u16(this.entries.length),u32(central.length),u32(offset),u16(0)]);
      return new Blob([join([...locals,central,end])],{type});
    }
  }

  async function buildXlsx(sheets, fileName='candidate.xlsx') {
    const zip = new ZipWriter();
    const sheetDefs = sheets.map((sheet,index) => `<sheet name="${xml(sheet.name.slice(0,31))}" sheetId="${index+1}" r:id="rId${index+1}"/>`).join('');
    const overrides = sheets.map((_,index) => `<Override PartName="/xl/worksheets/sheet${index+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const rels = sheets.map((_,index) => `<Relationship Id="rId${index+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index+1}.xml"/>`).join('');
    await zip.add('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}</Types>`);
    await zip.add('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    await zip.add('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetDefs}</sheets></workbook>`);
    await zip.add('xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    await zip.add('xl/styles.xml','<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF075436"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>');
    for(let index=0;index<sheets.length;index++) await zip.add(`xl/worksheets/sheet${index+1}.xml`,sheetXml(sheets[index].rows));
    return new File([zip.blob('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')],fileName,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }

  function wrap(ctx,text,maxWidth){
    const words=String(text ?? '').replace(/\s+/g,' ').trim().split(' '); const lines=[]; let line='';
    for(const word of words){ const next=line?`${line} ${word}`:word; if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;}else line=next; }
    if(line) lines.push(line); return lines.length?lines:['—'];
  }
  async function canvasJpeg(canvas){ return new Promise((resolve) => canvas.toBlob(resolve,'image/jpeg',.9)); }
  function newPdfCanvas(pageNo,title){
    const canvas=document.createElement('canvas'); canvas.width=1240; canvas.height=1754; const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#075436';ctx.fillRect(0,0,canvas.width,125);
    ctx.fillStyle='#f3c84b';ctx.font='700 27px Georgia';ctx.fillText('CITRONEX / PPO SIECHNICE',82,58);ctx.fillStyle='#fff';ctx.font='20px Arial';ctx.fillText(title,82,94);
    ctx.fillStyle='#758279';ctx.font='16px Arial';ctx.fillText(`Strona ${pageNo}`,1080,1710); return {canvas,ctx,y:178};
  }
  async function renderPdfDocument(title,personName,sections,fileName){
    const pages=[]; let page=newPdfCanvas(1,title); let {ctx}=page;
    ctx.fillStyle='#173426';ctx.font='700 45px Georgia';for(const line of wrap(ctx,personName,1060)){ctx.fillText(line,82,page.y);page.y+=54;} page.y+=12;
    for(const section of sections){
      const needed=72+section.lines.length*34; if(page.y+needed>1630){pages.push(await canvasJpeg(page.canvas));page=newPdfCanvas(pages.length+1,title);ctx=page.ctx;}
      ctx.fillStyle='#075436';ctx.font='700 23px Georgia';ctx.fillText(section.title,82,page.y);page.y+=31;ctx.fillStyle='#f3c84b';ctx.fillRect(82,page.y,88,4);page.y+=22;
      ctx.font='20px Arial';
      for(const item of section.lines){
        const lines=wrap(ctx,item,1060); if(page.y+lines.length*29>1640){pages.push(await canvasJpeg(page.canvas));page=newPdfCanvas(pages.length+1,title);ctx=page.ctx;ctx.font='20px Arial';}
        ctx.fillStyle='#263f33';for(const line of lines){ctx.fillText(line,95,page.y);page.y+=29;}page.y+=7;
      }
      page.y+=20;
    }
    pages.push(await canvasJpeg(page.canvas));
    return pdfFromJpegs(pages,fileName);
  }

  async function renderCandidateDossier(data,documents,fileName){
    const pages=[];const personName=`${data.firstName||''} ${data.lastName||''}`.trim();
    const finishPage=async(page)=>{page.ctx.fillStyle='#586c61';page.ctx.font='16px Arial';page.ctx.fillText(`Kandydat: ${personName} · ur. ${data.birthDate||'—'} · ${data.applicationId}`,82,1668);pages.push(await canvasJpeg(page.canvas));};
    let cover=newPdfCanvas(1,'DOSSIER KANDYDATA');
    cover.ctx.fillStyle='#173426';cover.ctx.font='700 49px Georgia';for(const line of wrap(cover.ctx,personName,1060)){cover.ctx.fillText(line,82,cover.y);cover.y+=58;}
    cover.y+=18;cover.ctx.fillStyle='#f3c84b';cover.ctx.fillRect(82,cover.y,150,7);cover.y+=48;cover.ctx.font='22px Arial';cover.ctx.fillStyle='#263f33';
    for(const line of [`Data urodzenia: ${data.birthDate||'—'}`,`ApplicationID: ${data.applicationId}`,`CandidateKey: ${data.candidateKey||'—'}`,`Rekruter: ${recruiterFor(data.recruiterId).name}`,`Telefon: ${data.phone||'—'}`,`Dokumenty źródłowe: ${documents.length}`]){cover.ctx.fillText(line,82,cover.y);cover.y+=39;}
    cover.y+=42;cover.ctx.fillStyle='#075436';cover.ctx.font='700 25px Georgia';cover.ctx.fillText('ZAWARTOŚĆ',82,cover.y);cover.y+=48;cover.ctx.fillStyle='#263f33';cover.ctx.font='21px Arial';
    ['1. CV w języku polskim','2. Formularz kandydata','3. Czytelne zdjęcia dokumentów'].forEach((line)=>{cover.ctx.fillText(line,96,cover.y);cover.y+=37;});
    await finishPage(cover);

    const addSectionGroup=async(groupTitle,sections)=>{
      let page=newPdfCanvas(pages.length+1,'DOSSIER KANDYDATA');let ctx=page.ctx;
      ctx.fillStyle='#173426';ctx.font='700 38px Georgia';ctx.fillText(groupTitle,82,page.y);page.y+=58;
      for(const section of sections){
        const needed=72+section.lines.length*34;if(page.y+needed>1605){await finishPage(page);page=newPdfCanvas(pages.length+1,'DOSSIER KANDYDATA');ctx=page.ctx;}
        ctx.fillStyle='#075436';ctx.font='700 23px Georgia';ctx.fillText(section.title,82,page.y);page.y+=31;ctx.fillStyle='#f3c84b';ctx.fillRect(82,page.y,88,4);page.y+=22;ctx.font='20px Arial';
        for(const item of section.lines){const lines=wrap(ctx,item,1060);if(page.y+lines.length*29>1605){await finishPage(page);page=newPdfCanvas(pages.length+1,'DOSSIER KANDYDATA');ctx=page.ctx;ctx.font='20px Arial';}ctx.fillStyle='#263f33';for(const line of lines){ctx.fillText(line,95,page.y);page.y+=29;}page.y+=7;}page.y+=20;
      }
      await finishPage(page);
    };
    await addSectionGroup('CV POLSKIE',cvSections(data));
    await addSectionGroup('FORMULARZ KANDYDATA',applicationSections(data,documents));

    for(let index=0;index<documents.length;index++){
      const doc=documents[index];const page=newPdfCanvas(pages.length+1,'DOKUMENTY KANDYDATA');const ctx=page.ctx;
      ctx.fillStyle='#173426';ctx.font='700 31px Georgia';ctx.fillText(`${index+1}. ${categoryLabel(doc.category)}`,82,page.y);page.y+=43;ctx.fillStyle='#586c61';ctx.font='18px Arial';ctx.fillText(doc.name,82,page.y);page.y+=38;
      if(doc.file.type.startsWith('image/')&&window.createImageBitmap){
        try{const bitmap=await createImageBitmap(doc.file,{imageOrientation:'from-image'});const maxW=1076,maxH=1250,scale=Math.min(maxW/bitmap.width,maxH/bitmap.height,1),width=Math.round(bitmap.width*scale),height=Math.round(bitmap.height*scale),x=Math.round((1240-width)/2),y=page.y+10;ctx.fillStyle='#eef2ef';ctx.fillRect(x-8,y-8,width+16,height+16);ctx.drawImage(bitmap,x,y,width,height);bitmap.close();}catch{ctx.fillStyle='#8a3e33';ctx.font='22px Arial';ctx.fillText('Nie udało się osadzić zdjęcia dokumentu.',82,page.y+90);}
      }else{ctx.fillStyle='#F3F6F4';ctx.fillRect(82,page.y+18,1076,330);ctx.fillStyle='#173426';ctx.font='700 28px Georgia';ctx.fillText('PLIK ŹRÓDŁOWY',122,page.y+105);ctx.font='21px Arial';ctx.fillStyle='#263f33';for(const line of wrap(ctx,`Nieobsługiwany format ${doc.file.type||'pliku'}. Dodaj dokument ponownie jako zdjęcie.`,950)){ctx.fillText(line,122,page.y+165);page.y+=31;}}
      await finishPage(page);
    }
    return pdfFromJpegs(pages,fileName);
  }
  async function pdfFromJpegs(jpegs,fileName){
    const imageBytes=await Promise.all(jpegs.map(async(blob)=>new Uint8Array(await blob.arrayBuffer()))); const objects=[];
    const pageIds=imageBytes.map((_,i)=>3+i*3); objects[1]=te.encode('<< /Type /Catalog /Pages 2 0 R >>'); objects[2]=te.encode(`<< /Type /Pages /Count ${imageBytes.length} /Kids [${pageIds.map((id)=>`${id} 0 R`).join(' ')}] >>`);
    imageBytes.forEach((bytes,i)=>{const pageId=3+i*3,imageId=pageId+1,contentId=pageId+2;objects[pageId]=te.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i+1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);objects[imageId]=join([te.encode(`<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`),bytes,te.encode('\nendstream')]);const stream=`q 595 0 0 842 0 0 cm /Im${i+1} Do Q`;objects[contentId]=te.encode(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);});
    const chunks=[te.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')],offsets=[0];let offset=chunks[0].length;
    for(let id=1;id<objects.length;id++){const part=join([te.encode(`${id} 0 obj\n`),objects[id],te.encode('\nendobj\n')]);offsets[id]=offset;chunks.push(part);offset+=part.length;}
    const xrefOffset=offset;let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let id=1;id<objects.length;id++)xref+=`${String(offsets[id]).padStart(10,'0')} 00000 n \n`;xref+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new File([join([...chunks,te.encode(xref)])],fileName,{type:'application/pdf'});
  }

  function cvSections(data){
    const contact=[`${clean(data.phone)} · ${clean(data.email,'brak e-mail')} · ${clean(data.messenger,'telefon')}`,`${clean(data.city)}, ${clean(data.country)} · obywatelstwo: ${clean(data.citizenship)}`];
    const profile=[`Preferowana praca: ${mapValue('job',data.job)}. Lokalizacja: ${mapValue('location',data.location)}.`, `Gotowość: ${mapValue('start',data.start)}. Zmiany: ${mapValue('boolean',data.shifts)}. Zakwaterowanie: ${mapValue('boolean',data.housing)}.`];
    const experience=[`${clean(data.experienceRole,'Pracownik')} — ${clean(data.experienceCompany,'firma niepodana')}, ${clean(data.experienceCountry)}`,`${clean(data.experienceFrom)} — ${clean(data.experienceTo,'obecnie')}`,...(data.tasks||[]).map((task)=>`• ${taskLabel(task)}`)];
    const skills=[`Języki: ${clean(data.languagesSkills,'nie podano')}`,`Prawo jazdy: ${clean(data.drivingLicense,'nie podano')}`,`Certyfikaty: ${clean(data.certificates,'nie podano')}`,`Wykształcenie: ${clean(data.education,'nie podano')}`];
    if(data.interview?.recruiterNotes) skills.push(`Informacja uzupełniona po rozmowie: ${data.interview.recruiterNotes}`);
    return [{title:'Kontakt',lines:contact},{title:'Profil zawodowy',lines:profile},{title:'Doświadczenie zawodowe',lines:experience},{title:'Umiejętności i uprawnienia',lines:skills}];
  }
  function applicationSections(data,docs){
    const recruiter=recruiterFor(data.recruiterId);return [
      {title:'Identyfikacja',lines:[`ID: ${data.applicationId}`,`Klucz kandydata: ${data.candidateKey}`,`Wersja: ${data.version}`,`Rekruter: ${recruiter.name} — ${recruiter.email}`]},
      {title:'Kandydat',lines:[`${data.firstName} ${data.lastName}`,`Data urodzenia: ${data.birthDate}`,`Telefon: ${data.phone}`,`Obywatelstwo: ${data.citizenship}`,`Miejsce pobytu: ${data.city}, ${data.country}`]},
      {title:'Dokumenty i pobyt',lines:[`W Polsce: ${mapValue('boolean',data.inPoland)}`,`Status: ${mapValue('legal',data.legalStatus)}`,`Ważność: ${clean(data.legalExpiry,'nie podano')}`,`Załączniki: ${docs.length}`]},
      {title:'Praca',lines:[`Lokalizacja: ${mapValue('location',data.location)}`,`Praca: ${mapValue('job',data.job)}`,`Start: ${mapValue('start',data.start)}`,`Zakwaterowanie: ${mapValue('boolean',data.housing)}`,`Źródło: ${mapValue('source',data.source)} — ${clean(data.sourceDetails)}`]},
      {title:'Rozmowa rekrutera',lines:[`Status: ${data.status||'NEW'}`,`Data rozmowy: ${clean(data.interviewDate,'nie przeprowadzono')}`,`Następny kontakt: ${clean(data.nextContact,'nie ustalono')}`,`Notatka: ${clean(data.recruiterNotes,'brak')}`]}
    ];
  }

  async function optimizeImage(file){
    if(!/^image\/(jpeg|png|webp)$/i.test(file.type)||!window.createImageBitmap)return {file,note:''};
    try{const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});const edge=Math.max(bitmap.width,bitmap.height),small=Math.min(bitmap.width,bitmap.height),scale=Math.min(1,2200/edge);if(scale===1&&file.size<2500000){bitmap.close();return {file,note:small<900?'Sprawdź ostrość zdjęcia.':''};}const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise((resolve)=>canvas.toBlob(resolve,'image/jpeg',.84));if(!blob||blob.size>=file.size)return {file,note:''};return {file:new File([blob],`${file.name.replace(/\.[^.]+$/,'')}.jpg`,{type:'image/jpeg',lastModified:file.lastModified}),note:`${formatBytes(file.size)} → ${formatBytes(blob.size)}${small<900?' · sprawdź ostrość':''}`};}catch{return {file,note:''};}
  }

  function documentFileName(data,doc,index){const ext=(doc.file.name.split('.').pop()||'bin').toLowerCase();return `${packageBase(data)}_${filePart(doc.category,'document')}_${String(index+1).padStart(2,'0')}.${ext}`;}
  async function buildPackage(data,documents=[],extraFiles=[]){
    const updated={...data,candidateKey:data.candidateKey||await candidateKey(data),updatedAt:stamp(),version:Number(data.version)||1};const base=packageBase(updated);const preparedDocs=documents.map((doc,index)=>({...doc,name:documentFileName(updated,doc,index)}));
    const dossier=await renderCandidateDossier(updated,preparedDocs,`${base}_DOSSIER_PL_v${updated.version}.pdf`);
    const row=candidateRow(updated,preparedDocs);row[row.length-1]=dossier.name;updated.excelLine=row.map((value)=>String(value??'').replace(/[\t\r\n]+/g,' ')).join('\t');const interviewRows=[['ROZMOWA WIDEO - DANE DO UZUPELNIENIA',''],['ApplicationID',updated.applicationId],['CandidateKey',updated.candidateKey],['Kandydat',`${updated.firstName||''} ${updated.lastName||''}`.trim()],['Rekruter',recruiterFor(updated.recruiterId).name],['Data rozmowy',''],['Status','VIDEO_SCHEDULED'],['Tozsamosc potwierdzona',''],['Dokumenty zweryfikowane',''],['Gotowosc do pracy',''],['Potwierdzona lokalizacja',''],['Potwierdzona oferta',''],['Poziom jezyka polskiego',''],['Pozostale jezyki',''],['Motywacja 1-5',''],['Zakwaterowanie',''],['Ryzyka / przeciwwskazania',''],['Nastepny kontakt',''],['Decyzja / powod',''],['Notatka rekrutera','']];const xlsx=await buildXlsx([{name:'Candidates',rows:[COLUMNS.map(([,label])=>label),row]},{name:'Interview',rows:interviewRows},{name:'Documents',rows:[['ApplicationID','Kategoria','Nazwa','Rozmiar'],...preparedDocs.map((doc)=>[updated.applicationId,categoryLabel(doc.category),doc.name,doc.file.size])]},{name:'Calls',rows:[['ApplicationID','Status','Data rozmowy','Następny kontakt','Notatka'],[updated.applicationId,updated.status||'NEW',updated.interviewDate||'',updated.nextContact||'',updated.recruiterNotes||'']]}],`${base}_ROW_v${updated.version}.xlsx`);
    const tsv=new File([`\uFEFF${COLUMNS.map(([,label])=>label).join('\t')}\r\n${row.map((value)=>String(value??'').replace(/[\t\r\n]+/g,' ')).join('\t')}\r\n`],`${base}_ROW_v${updated.version}.tsv`,{type:'text/tab-separated-values;charset=utf-8'});
    const manifestData={schema:'citronex-candidate-package',schemaVersion:1,appVersion:VERSION,exportedAt:stamp(),candidate:updated,documents:preparedDocs.map((doc)=>({category:doc.category,label:categoryLabel(doc.category),name:doc.name,originalName:doc.file.name,size:doc.file.size,type:doc.file.type,note:doc.note||''}))};
    const manifest=new File([JSON.stringify(manifestData,null,2)],'manifest.json',{type:'application/json'});const recruiter=recruiterFor(updated.recruiterId);const message=[`KANDYDAT: ${updated.firstName} ${updated.lastName}`,`DATA URODZENIA: ${updated.birthDate}`,`TELEFON: ${updated.phone}`,`ID: ${updated.applicationId}`,`REKRUTER: ${recruiter.name} (${recruiter.email})`,'','PDF: CV, ankieta i dokumenty kandydata.','','WIERSZ DO EXCEL (skopiuj całą poniższą linię):',updated.excelLine].join('\r\n');
    const messageFile=new File([message],`${base}_MESSAGE.txt`,{type:'text/plain;charset=utf-8'});
    return {data:updated,base,manifest,dossier,xlsx,tsv,message,messageFile,documents:preparedDocs,shareFiles:[dossier]};
  }

  function download(file){const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  async function sharePackage(result){const files=[result.dossier].filter(Boolean);let supported=false;try{supported=!!navigator.share&&(!navigator.canShare||navigator.canShare({files}));}catch{}if(supported){await navigator.share({title:`Kandydat ${result.data.firstName} ${result.data.lastName}`,text:result.message,files});return true;}if(result.dossier)download(result.dossier);return false;}
  async function extractManifest(file){if(file.name.toLowerCase().endsWith('.json'))return JSON.parse(await file.text());const bytes=new Uint8Array(await file.arrayBuffer());let offset=0;while(offset+30<=bytes.length){const view=new DataView(bytes.buffer,bytes.byteOffset+offset);if(view.getUint32(0,true)!==0x04034b50)break;const method=view.getUint16(8,true),size=view.getUint32(18,true),nameLength=view.getUint16(26,true),extraLength=view.getUint16(28,true),name=td.decode(bytes.slice(offset+30,offset+30+nameLength)),start=offset+30+nameLength+extraLength;if(name==='manifest.json'&&method===0)return JSON.parse(td.decode(bytes.slice(start,start+size)));offset=start+size;}throw new Error('manifest.json not found');}

  const DB_NAME='citronex-recruitment-offline';
  function db(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains('drafts'))database.createObjectStore('drafts');if(!database.objectStoreNames.contains('receipts'))database.createObjectStore('receipts');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function idb(store,mode,action){const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction(store,mode),request=action(tx.objectStore(store));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);tx.oncomplete=()=>database.close();});}
  const saveDraft=(key,value)=>idb('drafts','readwrite',(store)=>store.put(value,key));const loadDraft=(key)=>idb('drafts','readonly',(store)=>store.get(key));const deleteDraft=(key)=>idb('drafts','readwrite',(store)=>store.delete(key));const saveReceipt=(key,value)=>idb('receipts','readwrite',(store)=>store.put(value,key));const loadReceipt=(key)=>idb('receipts','readonly',(store)=>store.get(key));
  async function registerServiceWorker(){if('serviceWorker'in navigator)try{await navigator.serviceWorker.register('./service-worker.js');}catch{}}
  function mailto(result){const recruiter=recruiterFor(result.data.recruiterId);return `mailto:${recruiter.email}?subject=${encodeURIComponent(`Kandydat ${result.data.firstName} ${result.data.lastName} — ${result.data.applicationId}`)}&body=${encodeURIComponent(result.message)}`;}
  function channelUrl(channel,result){const recruiter=recruiterFor(result.data.recruiterId),phone=recruiter.phone.replace(/\D/g,''),message=encodeURIComponent(result.message);if(channel==='whatsapp')return `https://wa.me/${phone}?text=${message}`;if(channel==='telegram')return `https://t.me/share/url?url=&text=${message}`;if(channel==='viber')return `viber://forward?text=${message}`;return mailto(result);}

  window.OfflineRecruitment=Object.freeze({VERSION,RECRUITERS,LANGUAGES,DOCUMENT_CATEGORIES,TASKS,MAP,COLUMNS,clean,mapValue,categoryLabel,taskLabel,recruiterFor,formatBytes,stamp,applicationId,candidateKey,packageBase,candidateRow,optimizeImage,buildXlsx,buildPackage,download,sharePackage,extractManifest,saveDraft,loadDraft,deleteDraft,saveReceipt,loadReceipt,registerServiceWorker,mailto,channelUrl});
})();
