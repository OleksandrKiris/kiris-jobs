# Citronex / PPO Siechnice — mobilna ankieta rekrutacyjna 8.3

Adres produkcyjny:

`https://oleksandrkiris.github.io/kiris-jobs/apply/`

## Główny proces

1. Kandydat otwiera link na telefonie.
2. Wybiera język.
3. Wybiera rekrutera albo korzysta z linku przypisanego do konkretnego rekrutera.
4. Wskazuje, czy formularz wypełnia sam kandydat, czy przedstawiciel / partner.
5. Wpisuje dane kontaktowe i podstawowe informacje o pobycie.
6. Wybiera stanowisko oraz preferowaną lokalizację pracy.
7. Wybiera źródło kandydata za pomocą dużych kart: Facebook, Instagram, TikTok, Telegram, WhatsApp, Viber, polecenie, rekruter / agencja albo inne.
8. Wpisuje dokładnie, kto przekazał kandydata: osobę, partnera, grupę, stronę, profil lub kampanię.
9. Sprawdza całe zgłoszenie.
10. Naciska jeden przycisk: **Otwórz pocztę i wyślij zgłoszenie**.
11. Telefon otwiera aplikację pocztową z gotowym odbiorcą, tematem i treścią wiadomości.
12. Kandydat sprawdza wiadomość i sam naciska **Wyślij**.

Strona jest statyczna. Nie przesyła danych do GitHub, bazy danych ani zewnętrznego formularza.

## Tryb partnera / grupy

Dostępne są dwa warianty:

- `Wypełniam swoją ankietę`
- `Wypełniam za kandydata / grupę`

W trybie partnera formularz zapisuje:

- nazwę partnera, przedstawiciela lub firmy;
- kod grupy / partnera;
- dokładne źródło kandydata.

Po przygotowaniu jednego zgłoszenia partner może wybrać **Następny kandydat z tej grupy**. Rekruter, partner, kod grupy, źródło, stanowisko i lokalizacja zostają zachowane, natomiast dane osobowe poprzedniego kandydata są czyszczone.

## Rekruterzy

Formularz kieruje wiadomość wyłącznie do jednego z sześciu adresów zapisanych w `config.js`. Adres odbiorcy nie może zostać podmieniony parametrem URL.

## Lokalizacje

- Siechnice — szklarnie / sortownia
- Ryczywół / Kozienice — szklarnie
- Bogatynia — szklarnie / sortownia
- Zgorzelec — banany / sprzątanie
- Pruszcz Gdański — magazyn bananów
- dowolna lokalizacja — ofertę dobiera rekruter

Lokalizacja wskazana w formularzu jest preferencją. Dostępność miejsca potwierdza rekruter.

## Wiadomość e-mail

Temat wiadomości zawiera:

- oznaczenie `NOWY KANDYDAT`;
- oznaczenie `SLA 24H`;
- lokalizację;
- kod partnera, jeżeli dotyczy;
- imię i nazwisko;
- obywatelstwo;
- wybranego rekrutera.

Na początku treści znajdują się najważniejsze informacje operacyjne:

- ID zgłoszenia;
- termin pierwszego kontaktu;
- rekruter;
- telefon;
- komunikator;
- lokalizacja;
- stanowisko;
- źródło.

Niżej znajduje się pełna tabela kandydata oraz jeden wiersz TSV do wspólnego Excela.

## Excel

W wiadomości znajduje się blok:

`DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A`

Rekruter kopiuje dokładnie jeden następny wiersz i wkleja go do pierwszej pustej komórki kolumny A we wspólnym Excelu. Kolejność 40 kolumn jest zdefiniowana w `config.js`.

Początkowy status: `NOWY`.

SLA pierwszego kontaktu: 24 godziny od utworzenia zgłoszenia.

## Parametry linku

Obsługiwane parametry:

- `lang`
- `recruiter`
- `location`
- `src`
- `campaign`
- `vacancy`
- `partner`
- `group`

Przykład zwykłego linku:

`https://oleksandrkiris.github.io/kiris-jobs/apply/?lang=uk&recruiter=yana&location=siechnice&src=facebook&campaign=greenhouse_01`

Przykład linku partnera:

`https://oleksandrkiris.github.io/kiris-jobs/apply/?lang=ka&recruiter=oleksandr&location=siechnice&src=referral&partner=Giorgi%20Beridze&group=GE-BOLNISI`

## Czego formularz nie robi

- nie wysyła wiadomości automatycznie;
- nie przechowuje kandydatów w bazie;
- nie przesyła dokumentów;
- nie tworzy plików EML;
- nie kopiuje całej ankiety do schowka;
- nie pobiera pliku TXT;
- nie używa Google Forms, Microsoft Forms, Firebase ani Supabase.

## Test

```bash
npm test
```

Test kontroluje między innymi:

- 20 języków;
- 6 rekruterów;
- 6 lokalizacji;
- tryb kandydata i partnera;
- obowiązkowe dokładne źródło;
- układ mobilny;
- wiadomość e-mail;
- zgodność 40 kolumn Excel;
- brak dodatkowych sposobów wysyłki.
