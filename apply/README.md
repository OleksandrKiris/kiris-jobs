# Citronex / PPO Siechnice — publiczna ankieta rekrutacyjna 5.0

Adres produkcyjny:

`https://oleksandrkiris.github.io/kiris-jobs/apply/`

## Proces

1. Kandydat wybiera język.
2. Kandydat wybiera jednego z sześciu rekruterów.
3. Wypełnia dane kontaktowe, pobytowe i dotyczące pracy.
4. Wybiera preferowaną lokalizację Citronex / PPO Siechnice.
5. Wskazuje rodzaje dokumentów i może wybrać pliki na urządzeniu.
6. Sprawdza zgłoszenie.
7. Przygotowuje wiadomość `.eml` z załącznikami albo otwiera zwykłą wiadomość przez `mailto:`.
8. Rekruter otrzymuje czytelną tabelę, SLA 24 h, CSV oraz jeden wiersz TSV do wklejenia do wspólnego Excela.

## Lokalizacje

- Siechnice — szklarnie / sortownia
- Ryczywół / Kozienice — szklarnie
- Bogatynia — szklarnie / sortownia
- Zgorzelec — magazyn bananów / sprzątanie
- Pruszcz Gdański — magazyn bananów
- dowolna dostępna lokalizacja / do uzgodnienia

Wybrana lokalizacja jest preferencją kandydata. Dostępność miejsca potwierdza rekruter.

## E-mail i dokumenty

`mailto:` nie może automatycznie dodać plików. Dlatego są dwie metody:

- **EML z załącznikami** — strona tworzy gotowy szkic wiadomości z CSV i wybranymi dokumentami; kandydat otwiera plik w programie pocztowym, sprawdza adres i wysyła.
- **Zwykły e-mail** — strona otwiera gotową wiadomość do wybranego rekrutera; kandydat ręcznie dodaje pliki przez ikonę spinacza.

Pliki nie są wysyłane do GitHub ani zapisywane w bazie strony.

## Excel

W treści wiadomości znajduje się blok:

`DANE DO EXCEL — SKOPIUJ TYLKO NASTĘPNY WIERSZ`

Rekruter kopiuje wyłącznie następną linię i wkleja ją do pierwszej pustej komórki kolumny A we wspólnym pliku. Kolejność 41 kolumn jest zdefiniowana w `config.js`.

Początkowy status: `NOWY`. SLA pierwszego kontaktu: 24 godziny.

## Parametry linku

Przykład:

`?lang=uk&recruiter=yana&location=siechnice&src=facebook_ukraine&campaign=greenhouse_01&vacancy=szklarnia`

Dozwolone parametry:

- `lang`
- `recruiter`
- `location`
- `src`
- `campaign`
- `vacancy`

Adres e-mail nie może być podmieniony przez URL.

## Test

```bash
npm test
```

Test kontroluje języki, rekruterów, lokalizacje, dokumenty, strukturę wiadomości, EML, CSV, Excel i brak przycisków kopiowania całej ankiety lub pobierania TXT.
