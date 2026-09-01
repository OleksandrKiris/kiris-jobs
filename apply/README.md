# Formularz kandydata 4.0 — Rekrutacja PPO Siechnice

Publiczny, wielojęzyczny formularz rekrutacyjny działający jako statyczna strona GitHub Pages.

## Adres produkcyjny

`https://oleksandrkiris.github.io/kiris-jobs/apply/`

## Przebieg dla kandydata

1. Kandydat wybiera jeden z 20 języków.
2. Obowiązkowo wybiera rekrutera.
3. Uzupełnia dane kontaktowe, miejsce pobytu, status dokumentów i preferencje pracy.
4. Wybiera rodzaje dokumentów, które może przekazać.
5. Opcjonalnie dodaje pliki dokumentów ze swojego telefonu lub komputera.
6. Sprawdza całe zgłoszenie oraz adres wybranego rekrutera.
7. Wysyła zgłoszenie jedną z dwóch metod e-mail.

**W formularzu nie ma kopiowania ankiety, wiersza TSV ani ręcznego przenoszenia odpowiedzi.**

## Dwie metody wysłania

### 1. Gotowy plik `.eml` — metoda zalecana

Przycisk tworzy kompletną, niesentowaną wiadomość e-mail zawierającą:

- adres wybranego rekrutera;
- uporządkowaną tabelę HTML z danymi kandydata;
- tekstową wersję wiadomości;
- plik CSV z jednym wierszem gotowym do otwarcia lub importu w Excelu;
- wszystkie pliki dokumentów wybrane przez kandydata.

Wiadomość ma nagłówek `X-Unsent: 1`. Kandydat zapisuje plik, otwiera go w Outlooku, Apple Mail albo innej zgodnej aplikacji pocztowej, sprawdza odbiorcę i załączniki, a następnie naciska `Wyślij`.

### 2. Otwarcie aplikacji pocztowej przez `mailto:`

Formularz otwiera gotową wiadomość do wybranego rekrutera. Przeglądarki nie pozwalają dołączyć lokalnych plików do `mailto:`, dlatego kandydat dodaje dokumenty ręcznie ikoną spinacza w swojej poczcie.

## Rekruterzy i bezpieczny routing

Dozwoleni odbiorcy są zapisani wyłącznie w [`config.js`](config.js):

| ID linku | Rekruter | E-mail |
|---|---|---|
| `yana` | Yana Radushynska | `yana.radushynska@pposiechnice.pl` |
| `yuliia` | Yuliia Korniienko | `yuliia.korniienko@pposiechnice.pl` |
| `fariz` | Fariz Injaev | `fariz.injaev@pposiechnice.pl` |
| `oleksandr` | Oleksandr Kiris | `oleksandr.kiris@pposiechnice.pl` |
| `maksym` | Maksym Saliuk | `maksym.saliuk@pposiechnice.pl` |
| `anastasiia` | Anastasiia Derepa | `anastasiia.derepa@citronex.pl` |

Parametr URL może wskazać tylko ID z tej zamkniętej listy. Nie można wstrzyknąć dowolnego adresu e-mail. Kandydat zawsze widzi ekran wyboru i sam potwierdza rekrutera.

Przykład linku kampanii:

```text
https://oleksandrkiris.github.io/kiris-jobs/apply/?lang=uk&recruiter=oleksandr&src=facebook_ukraine&campaign=greenhouse_01&vacancy=siechnice
```

Obsługiwane parametry:

- `lang` — sugerowany język;
- `recruiter` — sugerowany rekruter;
- `src` — źródło linku;
- `campaign` — nazwa kampanii;
- `vacancy` — kod albo nazwa oferty.

## Dokumenty i limity

Obsługiwane rozszerzenia:

- PDF;
- JPG/JPEG;
- PNG;
- WEBP;
- HEIC/HEIF;
- DOC/DOCX.

Limity domyślne:

- maksymalnie 12 plików;
- maksymalnie 8 MB na jeden plik;
- maksymalnie 12 MB wszystkich plików łącznie.

Kandydat może zaznaczyć m.in. paszport, dokument pobytowy, PESEL UKR, dokument dotyczący prawa do pracy, prawo jazdy/Code 95, uprawnienia, CV albo inny dokument. Opcja `Brak dokumentów do załączenia` nie może być łączona z innymi typami ani z plikami.

## Prywatność

- GitHub przechowuje wyłącznie publiczny kod strony.
- Dane wpisane w formularzu nie są wysyłane do GitHub ani do żadnej bazy.
- Niedokończona część tekstowa formularza jest przechowywana lokalnie w `localStorage` przeglądarki.
- Wybrane pliki **nie są zapisywane w `localStorage`** i po odświeżeniu strony trzeba wybrać je ponownie.
- Pliki pozostają na urządzeniu kandydata do chwili utworzenia lub wysłania wiadomości e-mail.
- Przed dołączeniem plików kandydat potwierdza osobną zgodę na ich przekazanie wybranemu rekruterowi do celów rekrutacyjnych.

## CSV dla rekrutera

CSV jest tworzony automatycznie i dołączany do pliku `.eml`. Używa kodowania UTF-8 z BOM oraz separatora `;`, dzięki czemu jest wygodny dla polskiego Excela. Pierwszy wiersz zawiera stałe nagłówki, a drugi — dane jednego kandydata.

Dane zaczynające się od `=`, `+`, `-` lub `@` są zabezpieczane przed wykonaniem jako formuła arkusza kalkulacyjnego.

Początkowy status każdego zgłoszenia: `NOWY`.

## Języki

Formularz obsługuje 20 języków:

- polski, ukraiński, rosyjski i angielski;
- gruziński, azerski, ormiański i turecki;
- uzbecki, kirgiski, tadżycki i kazachski;
- hindi, bengalski, nepalski, urdu i syngaleski;
- filipiński, indonezyjski i wietnamski.

Urdu działa w układzie RTL. Instrukcje dotyczące dokumentów, limitów i wysyłki mają własne tłumaczenia dla wszystkich 20 języków.

## Pliki

- `index.html` — struktura pięciu etapów i ekranu wysyłki;
- `styles.css` — responsywny wygląd na telefon i komputer;
- `config.js` — rekruterzy, limity, rodzaje dokumentów i kolumny CSV;
- `i18n-core.js` — podstawowe języki i polskie wartości wewnętrzne;
- `i18n-caucasus-central.js` — Kaukaz i Azja Centralna;
- `i18n-asia.js` — Azja Południowa i Południowo-Wschodnia;
- `delivery-i18n.js` — instrukcje dokumentów i wysyłki w 20 językach;
- `app.js` — walidacja, pliki lokalne, CSV, HTML, MIME `.eml`, `mailto:` i wersja robocza.

## Kontrola przed publikacją

```bash
npm test
```

Walidacja sprawdza m.in.:

- składnię wszystkich plików JavaScript;
- sześciu właściwych rekruterów i ich adresy;
- 20 języków oraz komplet tłumaczeń wysyłki;
- limity i typy dokumentów;
- obecność generatora `.eml`, HTML i CSV;
- obecność wymaganych ekranów i pól plików;
- brak przycisków oraz kodu do kopiowania ankiety.
