import fs from 'node:fs/promises';
import path from 'node:path';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = path.resolve('outputs/recruitment-offline');
const previewDir = path.join(outputDir, 'previews');
const recruiters = [
  ['yana','Yana Radushynska'],['yuliia','Yuliia Korniienko'],['fariz','Fariz Injaev'],
  ['oleksandr','Oleksandr Kiris'],['maksym','Maksym Saliuk'],['anastasiia','Anastasiia Derepa']
];
const columns = [
  'ID zgłoszenia','Klucz kandydata','Wersja','Data zgłoszenia','Ostatnia aktualizacja','Język','ID rekrutera','Rekruter','E-mail rekrutera','Ankietę wypełnia',
  'Przedstawiciel / partner','Kod grupy / partnera','Imię','Nazwisko','Imię i nazwisko łacinką','Data urodzenia','Płeć','Telefon','Komunikator','E-mail kandydata',
  'Obywatelstwo','Kraj pobytu','Miasto','W Polsce','Dokument pobytowy','Ważny do','PESEL UKR','Paszport biometryczny','Preferowana lokalizacja','Rodzaj pracy',
  'Gotowość rozpoczęcia','Praca zmianowa','Potrzebne zakwaterowanie','Potrzebny transport','Planowany okres pracy','Ograniczenia zdrowotne / fizyczne','Rozmiar odzieży','Rozmiar obuwia',
  'Firma','Kraj doświadczenia','Stanowisko','Doświadczenie od','Doświadczenie do','Obowiązki','Wykształcenie','Znajomość języków','Prawo jazdy','Certyfikaty','Źródło','Dokładne źródło',
  'Status','Data rozmowy wideo','Następny kontakt','Motywacja','Język polski — ocena','Notatka rekrutera','Liczba dokumentów','Nazwa pakietu'
];
const statuses = [
  ['NEW','Nowe zgłoszenie'],['CONTACTED','Pierwszy kontakt wykonany'],['VIDEO_SCHEDULED','Rozmowa wideo zaplanowana'],['INTERVIEWED','Rozmowa przeprowadzona'],
  ['DOCUMENTS_MISSING','Brakuje dokumentów'],['APPROVED','Kandydat zaakceptowany'],['REJECTED','Kandydat odrzucony'],['NO_RESPONSE','Brak odpowiedzi'],['DUPLICATE','Duplikat'],['HIRED','Zatrudniony']
];
const locations = [['siechnice','Siechnice'],['ryczywol','Ryczywół / Kozienice'],['bogatynia','Bogatynia'],['zgorzelec','Zgorzelec'],['pruszcz','Pruszcz Gdański'],['any','Dowolna lokalizacja']];
const sources = [['facebook','Facebook'],['instagram','Instagram'],['tiktok','TikTok'],['telegram','Telegram'],['whatsapp','WhatsApp'],['viber','Viber'],['referral','Polecenie'],['recruiter','Rekruter / agencja'],['other','Inne']];
const sheetNames = ['START','Dashboard','Interview','Candidates','Calls','Documents','Statuses','Locations','Sources'];

function colName(index){let result='';for(let value=index+1;value;value=Math.floor((value-1)/26))result=String.fromCharCode(65+((value-1)%26))+result;return result;}
const statusCol = colName(columns.indexOf('Status'));
const locationCol = colName(columns.indexOf('Preferowana lokalizacja'));
const recruiterCol = colName(columns.indexOf('Rekruter'));
const headerStyle = {fill:'#075436',font:{bold:true,color:'#FFFFFF'},wrapText:true,verticalAlignment:'center'};
const titleStyle = {fill:'#F3C84B',font:{bold:true,color:'#173426',size:18},verticalAlignment:'center'};
const sectionStyle = {fill:'#E8F3EC',font:{bold:true,color:'#075436'}};

function createWorkbook(ownerId, ownerName, isMaster=false){
  const wb=Workbook.create();
  const start=wb.worksheets.add('START');
  const dashboard=wb.worksheets.add('Dashboard');
  const interview=wb.worksheets.add('Interview');
  const candidates=wb.worksheets.add('Candidates');
  const calls=wb.worksheets.add('Calls');
  const documents=wb.worksheets.add('Documents');
  const statusSheet=wb.worksheets.add('Statuses');
  const locationSheet=wb.worksheets.add('Locations');
  const sourceSheet=wb.worksheets.add('Sources');
  for(const sheet of [start,dashboard,interview,candidates,calls,documents,statusSheet,locationSheet,sourceSheet])sheet.showGridLines=false;

  start.mergeCells('A1:H2');
  start.getRange('A1:H2').values=[[isMaster?'SYSTEM REKRUTACJI - WSPÓLNA BAZA':`SYSTEM REKRUTACJI - ${ownerName}`]];
  start.getRange('A1:H2').format={fill:'#17324D',font:{bold:true,color:'#FFFFFF',size:21},horizontalAlignment:'center',verticalAlignment:'center'};
  start.mergeCells('A3:H3');
  start.getRange('A3:H3').values=[['Wersja produkcyjna 1.0 | offline | bez makr | jeden kandydat = jeden ApplicationID']];
  start.getRange('A3:H3').format={fill:'#EAF1F6',font:{color:'#17324D',italic:true},horizontalAlignment:'center',rowHeight:26};
  start.mergeCells('A5:H5');
  start.getRange('A5:H5').values=[['ZASADA GŁÓWNA: kandydat wysyła jeden kompletny ZIP tylko do wybranego rekrutera. Nie tworzymy duplikatów.']];
  start.getRange('A5:H5').format={fill:'#FFF4CC',font:{bold:true,color:'#7A5300'},wrapText:true,rowHeight:34};
  start.mergeCells('A7:D7');
  start.getRange('A7:D7').values=[['5 KROKÓW PRACY REKRUTERA']];
  start.mergeCells('F7:H7');
  start.getRange('F7:H7').values=[['MINIMUM PRZED ROZMOWĄ']];
  for(const range of ['A7:D7','F7:H7'])start.getRange(range).format={fill:'#2F6B5F',font:{bold:true,color:'#FFFFFF'},rowHeight:25};
  start.getRange('A8:D12').values=[
    ['1. Odbierz ZIP','Zapisz pakiet pod nazwą kandydata i datą urodzenia','',''],
    ['2. Dodaj kandydata','Wklej jeden wiersz do pierwszego wolnego wiersza Candidates','',''],
    ['3. Pierwszy kontakt','Ustaw CONTACTED albo NO_RESPONSE i termin kolejnego kontaktu','',''],
    ['4. Rozmowa wideo','Wypełnij żółte pola w Interview; sprawdź tożsamość i dokumenty','',''],
    ['5. Zapisz wynik','Skopiuj zielony wiersz do Calls i zmień Status w Candidates','','']
  ];
  for(let row=8;row<=12;row++)start.mergeCells(`B${row}:D${row}`);
  start.getRange('F8:H14').values=[
    ['ApplicationID','musi być unikalny',''],
    ['CandidateKey','telefon + data urodzenia',''],
    ['Imię, nazwisko, data urodzenia','zgodne z dokumentem',''],
    ['Telefon i rekruter','obowiązkowe',''],
    ['Status','z listy Statuses',''],
    ['Dokument pobytowy','sprawdzony lub oznaczony brak',''],
    ['Zgoda i źródło','muszą być zapisane','']
  ];
  for(let row=8;row<=14;row++)start.mergeCells(`G${row}:H${row}`);
  start.getRange('A8:H14').format={verticalAlignment:'center',wrapText:true};
  start.getRange('A8:H14').format.rowHeight=38;
  start.getRange('A8:A12').format={font:{bold:true,color:'#17324D'}};
  start.getRange('F8:F14').format={font:{bold:true,color:'#17324D'},fill:'#F4F7F8'};
  start.mergeCells('A16:H16');
  start.getRange('A16:H16').values=[['STATUS = NASTĘPNE DZIAŁANIE']];
  start.getRange('A16:H16').format={fill:'#17324D',font:{bold:true,color:'#FFFFFF'},rowHeight:25};
  start.getRange('A17:D17').values=[['Status','Znaczenie','Następne działanie','Termin']];
  start.getRange('A18:D26').values=[
    ['NEW','Nowe zgłoszenie','Pierwszy kontakt','tego samego dnia'],
    ['CONTACTED','Kontakt wykonany','Umów rozmowę wideo','do 24 h'],
    ['VIDEO_SCHEDULED','Rozmowa umówiona','Przeprowadź Interview','zgodnie z terminem'],
    ['INTERVIEWED','Rozmowa zakończona','Podejmij decyzję / sprawdź dokumenty','do 24 h'],
    ['DOCUMENTS_MISSING','Brakuje dokumentów','Wyślij dokładną listę braków','ustaw następny kontakt'],
    ['APPROVED','Kandydat zaakceptowany','Przekaż do procesu zatrudnienia','tego samego dnia'],
    ['REJECTED','Kandydat odrzucony','Zapisz powód decyzji','zamknij sprawę'],
    ['NO_RESPONSE','Brak odpowiedzi','Ustaw kolejny kontakt','maks. 3 próby'],
    ['HIRED','Zatrudniony','Archiwizuj komplet','koniec procesu']
  ];
  start.getRange('A17:D17').format={fill:'#2F6B5F',font:{bold:true,color:'#FFFFFF'}};
  start.getRange('A18:D26').format={wrapText:true,verticalAlignment:'center'};
  start.getRange('A18:D26').format.rowHeight=31;
  start.mergeCells('F17:H17');
  start.getRange('F17:H17').values=[['KONTROLA NA KONIEC DNIA']];
  start.getRange('F17:H17').format={fill:'#2F6B5F',font:{bold:true,color:'#FFFFFF'}};
  start.getRange('F18:H24').values=[
    ['[ ]','Każdy NEW ma właściciela i kontakt',''],
    ['[ ]','Każda rozmowa ma wpis w Calls',''],
    ['[ ]','Każdy brak dokumentu ma termin',''],
    ['[ ]','Każde odrzucenie ma powód',''],
    ['[ ]','Brak duplikatów CandidateKey',''],
    ['[ ]','Zaakceptowani przekazani do Master',''],
    ['[ ]','ZIP-y zapisane pod poprawną nazwą','']
  ];
  for(let row=18;row<=24;row++)start.mergeCells(`G${row}:H${row}`);
  start.getRange('F18:H24').format.rowHeight=31;
  start.getRange('F18:F24').format={font:{bold:true,color:'#2F6B5F'},horizontalAlignment:'center'};
  start.mergeCells('A28:H28');
  start.getRange('A28:H28').values=[['KOLORY: żółty = wpisuje rekruter | niebieski = informacja / formuła | zielony = gotowe do skopiowania']];
  start.getRange('A28:H28').format={fill:'#EAF1F6',font:{bold:true,color:'#17324D'},horizontalAlignment:'center',rowHeight:28};
  start.getRange('A:A').format.columnWidth=23;
  start.getRange('B:D').format.columnWidth=19;
  start.getRange('E:E').format.columnWidth=3;
  start.getRange('F:F').format.columnWidth=26;
  start.getRange('G:H').format.columnWidth=18;
  start.freezePanes.freezeRows(5);

  interview.mergeCells('A1:F2');
  interview.getRange('A1:F2').values=[[`KARTA ROZMOWY WIDEO - ${ownerName||'WSPOLNA'}`]];
  interview.getRange('A1:F2').format={fill:'#17324D',font:{bold:true,color:'#FFFFFF',size:20},horizontalAlignment:'center',verticalAlignment:'center'};
  interview.mergeCells('A3:F3');
  interview.getRange('A3:F3').values=[['Uzupelnij podczas rozmowy. Potem dopisz wynik do Calls i zaktualizuj status w Candidates.']];
  interview.getRange('A3:F3').format={fill:'#EAF1F6',font:{color:'#17324D',italic:true},wrapText:true,rowHeight:34};
  const interviewLayout=[
    {section:'KANDYDAT'},
    {label:'ApplicationID'},
    {label:'CandidateKey'},
    {label:'Imie i nazwisko'},
    {label:'Telefon'},
    {label:'Rekruter',value:ownerName||''},
    {section:'WERYFIKACJA WIDEO'},
    {label:'Data rozmowy'},
    {label:'Status',value:'VIDEO_SCHEDULED'},
    {label:'Tozsamosc potwierdzona'},
    {label:'Dokumenty zweryfikowane'},
    {label:'Gotowosc do pracy'},
    {label:'Zakwaterowanie'},
    {section:'DOPASOWANIE I DECYZJA'},
    {label:'Jezyk polski'},
    {label:'Pozostale jezyki'},
    {label:'Motywacja 1-5'},
    {label:'Potwierdzona oferta'},
    {label:'Potwierdzona lokalizacja'},
    {label:'Ryzyka / przeciwwskazania'},
    {label:'Nastepny kontakt'},
    {label:'Decyzja / powod'},
    {label:'Notatka rekrutera'}
  ];
  const interviewRows={};
  let interviewRow=5;
  for(const item of interviewLayout){
    if(item.section){
      interview.mergeCells(`A${interviewRow}:F${interviewRow}`);
      interview.getRange(`A${interviewRow}:F${interviewRow}`).values=[[item.section]];
      interview.getRange(`A${interviewRow}:F${interviewRow}`).format={fill:'#2F6B5F',font:{bold:true,color:'#FFFFFF'},rowHeight:24};
    }else{
      interviewRows[item.label]=interviewRow;
      interview.mergeCells(`B${interviewRow}:F${interviewRow}`);
      interview.getRange(`A${interviewRow}`).values=[[item.label]];
      interview.getRange(`B${interviewRow}`).values=[[item.value||'']];
      interview.getRange(`A${interviewRow}`).format={fill:'#EAF1F6',font:{bold:true,color:'#17324D'},verticalAlignment:'center'};
      interview.getRange(`B${interviewRow}:F${interviewRow}`).format={fill:'#FFF4CC',font:{color:'#1D2B36'},verticalAlignment:'center',wrapText:true};
      interview.getRange(`A${interviewRow}:F${interviewRow}`).format.borders={top:{style:'continuous',color:'#CBD6DE'},bottom:{style:'continuous',color:'#CBD6DE'},left:{style:'continuous',color:'#CBD6DE'},right:{style:'continuous',color:'#CBD6DE'}};
      interview.getRange(`A${interviewRow}:F${interviewRow}`).format.rowHeight=item.label==='Notatka rekrutera'?60:26;
    }
    interviewRow++;
  }
  interview.getRange(`B${interviewRows.Status}`).dataValidation={rule:{type:'list',formula1:'=Statuses!$A$2:$A$20'}};
  for(const label of ['Tozsamosc potwierdzona','Dokumenty zweryfikowane','Gotowosc do pracy','Zakwaterowanie','Potwierdzona oferta','Potwierdzona lokalizacja'])interview.getRange(`B${interviewRows[label]}`).dataValidation={rule:{type:'list',formula1:'"Tak,Nie,Do wyjaśnienia"'}};
  interview.getRange(`B${interviewRows['Jezyk polski']}`).dataValidation={rule:{type:'list',formula1:'"Brak,A1,A2,B1,B2,C1,C2"'}};
  interview.getRange(`B${interviewRows['Motywacja 1-5']}`).dataValidation={rule:{type:'list',formula1:'"1,2,3,4,5"'}};
  interview.mergeCells('A29:L29');
  interview.getRange('A29:L29').values=[['PO ROZMOWIE: skopiuj poniższy zielony wiersz jako wartości do pierwszego wolnego wiersza w Calls.']];
  interview.getRange('A29:L29').format={fill:'#E8F4EF',font:{bold:true,color:'#1E5A4E'},wrapText:true,rowHeight:30};
  interview.getRange('A30:L30').values=[['ApplicationID','CandidateKey','Data rozmowy','Rekruter','Status','Tożsamość','Dokumenty','Gotowość','Motywacja','Język polski','Następny kontakt','Notatka']];
  interview.getRange('A30:L30').format={fill:'#17324D',font:{bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:32};
  interview.getRange('A31:L31').formulas=[[
    `=IF(B${interviewRows.ApplicationID}="","",B${interviewRows.ApplicationID})`,
    `=IF(B${interviewRows.CandidateKey}="","",B${interviewRows.CandidateKey})`,
    `=IF(B${interviewRows['Data rozmowy']}="","",B${interviewRows['Data rozmowy']})`,
    `=IF(B${interviewRows.Rekruter}="","",B${interviewRows.Rekruter})`,
    `=IF(B${interviewRows.Status}="","",B${interviewRows.Status})`,
    `=IF(B${interviewRows['Tozsamosc potwierdzona']}="","",B${interviewRows['Tozsamosc potwierdzona']})`,
    `=IF(B${interviewRows['Dokumenty zweryfikowane']}="","",B${interviewRows['Dokumenty zweryfikowane']})`,
    `=IF(B${interviewRows['Gotowosc do pracy']}="","",B${interviewRows['Gotowosc do pracy']})`,
    `=IF(B${interviewRows['Motywacja 1-5']}="","",B${interviewRows['Motywacja 1-5']})`,
    `=IF(B${interviewRows['Jezyk polski']}="","",B${interviewRows['Jezyk polski']})`,
    `=IF(B${interviewRows['Nastepny kontakt']}="","",B${interviewRows['Nastepny kontakt']})`,
    `=IF(B${interviewRows['Notatka rekrutera']}="","",B${interviewRows['Notatka rekrutera']})`
  ]];
  interview.getRange('A31:L31').format={fill:'#D9F0E5',font:{bold:true,color:'#17324D'},wrapText:true,rowHeight:42};
  interview.getRange('A:A').format.columnWidth=31;
  interview.getRange('B:F').format.columnWidth=16;
  interview.getRange('G:L').format.columnWidth=15;
  interview.freezePanes.freezeRows(3);

  candidates.mergeCells('A1:H2');
  candidates.getRange('A1:H2').values=[[isMaster?'CITRONEX — WSPÓLNA BAZA KANDYDATÓW':`CITRONEX — ${ownerName}`]];
  candidates.getRange('A1:H2').format=titleStyle;
  candidates.getRange('A3:H3').merge();
  candidates.getRange('A3:H3').values=[[isMaster?'Wklejaj lub importuj wiersze wszystkich rekruterów. CandidateKey wykrywa tę samą osobę, ApplicationID identyfikuje zgłoszenie.':`Plik rekrutera: ${ownerName}. Używaj tej samej kolejności kolumn co pakiet ankiety.`]];
  candidates.getRange('A3:H3').format={font:{color:'#5D7066',italic:true},wrapText:true};
  candidates.getRangeByIndexes(4,0,1,columns.length).values=[columns];
  candidates.getRangeByIndexes(4,0,1,columns.length).format=headerStyle;
  candidates.getRangeByIndexes(5,0,200,columns.length).values=Array.from({length:200},()=>Array(columns.length).fill(null));
  const candidateTable=candidates.tables.add(`A5:${colName(columns.length-1)}205`,true,`Candidates_${ownerId}`);
  candidateTable.style='TableStyleMedium4';candidateTable.showFilterButton=true;
  candidates.freezePanes.freezeRows(5);candidates.freezePanes.freezeColumns(4);
  candidates.getRange(`D6:E205`).format.numberFormat='yyyy-mm-dd hh:mm';
  candidates.getRange(`P6:P205`).format.numberFormat='yyyy-mm-dd';
  candidates.getRange(`${statusCol}6:${statusCol}205`).dataValidation={rule:{type:'list',formula1:"'Statuses'!$A$2:$A$11"}};
  const statusRange=candidates.getRange(`${statusCol}6:${statusCol}205`);
  statusRange.conditionalFormats.add('containsText',{text:'NEW',format:{fill:'#DDEBFF',font:{color:'#174A8B',bold:true}}});
  statusRange.conditionalFormats.add('containsText',{text:'DOCUMENTS_MISSING',format:{fill:'#FFF0CB',font:{color:'#765313',bold:true}}});
  statusRange.conditionalFormats.add('containsText',{text:'APPROVED',format:{fill:'#DDF4E7',font:{color:'#075436',bold:true}}});
  statusRange.conditionalFormats.add('containsText',{text:'HIRED',format:{fill:'#BFE9D0',font:{color:'#06452D',bold:true}}});
  statusRange.conditionalFormats.add('containsText',{text:'REJECTED',format:{fill:'#FFE0DD',font:{color:'#9E2B24',bold:true}}});
  statusRange.conditionalFormats.add('containsText',{text:'DUPLICATE',format:{fill:'#E8E8E8',font:{color:'#555555',bold:true}}});
  candidates.getRange('A5:BF205').format.rowHeight=20;
  candidates.getRange('A:A').format.columnWidth=20;candidates.getRange('B:B').format.columnWidth=22;candidates.getRange('M:T').format.columnWidth=17;candidates.getRange('AV:BF').format.columnWidth=19;

  const callHeaders=['ApplicationID','CandidateKey','Data rozmowy','Rekruter','Status','Tożsamość','Dokumenty','Gotowość','Motywacja','Język polski','Następny kontakt','Notatka'];
  calls.getRange('A1:L1').values=[callHeaders];calls.getRange('A1:L1').format=headerStyle;calls.getRange('A2:L201').values=Array.from({length:200},()=>Array(12).fill(null));calls.tables.add('A1:L201',true,`Calls_${ownerId}`).style='TableStyleMedium4';calls.freezePanes.freezeRows(1);calls.getRange('C2:C201').format.numberFormat='yyyy-mm-dd hh:mm';calls.getRange('K2:K201').format.numberFormat='yyyy-mm-dd hh:mm';calls.getRange('A:L').format.columnWidth=18;calls.getRange('L:L').format.columnWidth=34;
  calls.getRange('E2:E201').dataValidation={rule:{type:'list',formula1:"'Statuses'!$A$2:$A$11"}};

  const documentHeaders=['ApplicationID','CandidateKey','Kategoria','Nazwa pliku','Oryginalna nazwa','Typ MIME','Rozmiar bajty','Wersja','Data dodania','Uwagi'];
  documents.getRange('A1:J1').values=[documentHeaders];documents.getRange('A1:J1').format=headerStyle;documents.getRange('A2:J301').values=Array.from({length:300},()=>Array(10).fill(null));documents.tables.add('A1:J301',true,`Documents_${ownerId}`).style='TableStyleMedium4';documents.freezePanes.freezeRows(1);documents.getRange('A:J').format.columnWidth=19;documents.getRange('D:E').format.columnWidth=31;documents.getRange('J:J').format.columnWidth=30;

  statusSheet.getRange('A1:B11').values=[['Status','Znaczenie'],...statuses];statusSheet.getRange('A1:B1').format=headerStyle;statusSheet.getRange('A:B').format.columnWidth=28;statusSheet.freezePanes.freezeRows(1);
  locationSheet.getRange(`A1:B${locations.length+1}`).values=[['Kod','Lokalizacja'],...locations];locationSheet.getRange('A1:B1').format=headerStyle;locationSheet.getRange('A:B').format.columnWidth=28;
  sourceSheet.getRange(`A1:B${sources.length+1}`).values=[['Kod','Źródło'],...sources];sourceSheet.getRange('A1:B1').format=headerStyle;sourceSheet.getRange('A:B').format.columnWidth=28;

  dashboard.mergeCells('A1:F2');dashboard.getRange('A1:F2').values=[[isMaster?'WSPÓLNY PULPIT REKRUTACJI':`PULPIT — ${ownerName}`]];dashboard.getRange('A1:F2').format=titleStyle;
  dashboard.getRange('A4:B10').values=[['Wskaźnik','Wartość'],['Wszystkie zgłoszenia',null],['Nowe',null],['Po kontakcie',null],['Po rozmowie',null],['Zaakceptowane',null],['Zatrudnione',null]];
  dashboard.getRange('A4:B4').format=headerStyle;dashboard.getRange('A5:A10').format=sectionStyle;
  dashboard.getRange('B5:B10').formulas=[
    ["=COUNTA('Candidates'!$A$6:$A$205)"],[`=COUNTIF('Candidates'!$${statusCol}$6:$${statusCol}$205,"NEW")`],[`=COUNTIF('Candidates'!$${statusCol}$6:$${statusCol}$205,"CONTACTED")`],
    [`=COUNTIF('Candidates'!$${statusCol}$6:$${statusCol}$205,"INTERVIEWED")`],[`=COUNTIF('Candidates'!$${statusCol}$6:$${statusCol}$205,"APPROVED")`],[`=COUNTIF('Candidates'!$${statusCol}$6:$${statusCol}$205,"HIRED")`]
  ];
  dashboard.getRange('D4:E14').values=[['Status','Liczba'],...statuses.map(([code])=>[code,null])];dashboard.getRange('D4:E4').format=headerStyle;dashboard.getRange('D5:D14').format=sectionStyle;
  dashboard.getRange('E5:E14').formulas=statuses.map(([code])=>[`=COUNTIF('Candidates'!$${statusCol}$6:$${statusCol}$205,"${code}")`]);
  dashboard.getRange('A13:B19').values=[['Lokalizacja','Liczba'],...locations.map(([,name])=>[name,null])];dashboard.getRange('A13:B13').format=headerStyle;dashboard.getRange('A14:A19').format=sectionStyle;
  dashboard.getRange('B14:B19').formulas=locations.map(([,name])=>[`=COUNTIF('Candidates'!$${locationCol}$6:$${locationCol}$205,"${name}")`]);
  dashboard.getRange('A:B').format.columnWidth=25;dashboard.getRange('D:E').format.columnWidth=24;dashboard.getRange('B5:B19').format.numberFormat='0';dashboard.getRange('E5:E14').format.numberFormat='0';
  dashboard.getRange('A22:F24').merge();dashboard.getRange('A22:F24').values=[[isMaster?'Wspólny plik przyjmuje identyczne wiersze ze wszystkich pakietów. Sortuj po CandidateKey, aby znaleźć duplikaty, i po ApplicationID + Wersja, aby zachować historię.':`Ten skoroszyt jest przeznaczony dla: ${ownerName}. Po rozmowie importuj nowszą wersję wiersza i nie usuwaj poprzedniej wersji.`]];dashboard.getRange('A22:F24').format={fill:'#FFF3C3',font:{color:'#5B4800',italic:true},wrapText:true,verticalAlignment:'center'};
  return wb;
}

async function verifyAndSave(wb,fileName,savePreviews=false){
  const tableCheck=await wb.inspect({kind:'table',range:'Dashboard!A1:F24',include:'values,formulas',tableMaxRows:24,tableMaxCols:6,maxChars:5000});
  const formulaErrors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',options:{useRegex:true,maxResults:100},summary:'formula error scan',maxChars:2000});
  console.log(fileName,tableCheck.ndjson.slice(0,900),formulaErrors.ndjson.slice(0,400));
  for(const name of sheetNames){const preview=await wb.render({sheetName:name,autoCrop:'all',scale:.65,format:'png'});if((await preview.arrayBuffer()).byteLength<100)throw new Error(`Empty preview: ${fileName} / ${name}`);if(savePreviews)await fs.writeFile(path.join(previewDir,`${name}.png`),new Uint8Array(await preview.arrayBuffer()));}
  const output=await SpreadsheetFile.exportXlsx(wb);await output.save(path.join(outputDir,fileName));
}

await fs.mkdir(previewDir,{recursive:true});
for(const [id,name] of recruiters)await verifyAndSave(createWorkbook(id,name,false),`Recruitment_${id}.xlsx`,false);
await verifyAndSave(createWorkbook('master','Wspólna baza',true),'Recruitment_Master.xlsx',true);
console.log(`Created ${recruiters.length+1} workbooks in ${outputDir}`);
