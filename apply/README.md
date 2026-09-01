# Citronex / PPO Siechnice — publiczna ankieta rekrutacyjna

Adres produkcyjny:

`https://oleksandrkiris.github.io/kiris-jobs/apply/`

## Główny proces

1. Kandydat otwiera link na telefonie.
2. Wybiera język i swojego rekrutera.
3. Zaznacza, czy wypełnia formularz osobiście, czy jako partner / przedstawiciel grupy.
4. Uzupełnia dane kandydata, sytuację pobytową, lokalizację i preferencje pracy.
5. Wskazuje kanał pozyskania oraz konkretną osobę, partnera, profil, stronę lub grupę.
6. Sprawdza dane i naciska **„Otwórz pocztę i wyślij zgłoszenie”**.
7. Telefon otwiera aplikację pocztową z gotowym odbiorcą, tematem, tabelą kandydata i wierszem TSV do Excela.
8. Kandydat sprawdza wiadomość i samodzielnie naciska **„Wyślij”**.

Strona nie używa backendu, bazy danych ani zewnętrznego formularza.

## Interfejs mobilny

Formularz jest projektowany przede wszystkim dla telefonu:

- duże pola i przyciski;
- cztery krótkie etapy;
- karty wyboru rekrutera, lokalizacji, stanowiska, komunikatora i źródła;
- stałe przyciski „Wstecz” i „Dalej” w dolnej części ekranu;
- automatyczne zapisywanie niedokończonej ankiety przez 24 godziny;
- czytelne oznaczenie wypełnionych pól;
- ochrona przed podwójnym otwarciem wiadomości;
- obsługa RTL dla języka urdu.

## Partner / grupa

Po wyborze **„Wypełniam za kandydata / grupę”** pojawiają się pola:

- osoba / partner wypełniający;
- kod grupy / partnera.

Po przygotowaniu pierwszego zgłoszenia można użyć przycisku **„Następny kandydat z tej grupy”**. Formularz zachowuje rekrutera, partnera, kod grupy, lokalizację, stanowisko i źródło, a usuwa dane osobowe poprzedniego kandydata.

## Lokalizacje

- Siechnice — szklarnie / sortownia;
- Ryczywół / Kozienice — szklarnie;
- Bogatynia — szklarnie / sortownia;
- Zgorzelec — banany / sprzątanie;
- Pruszcz Gdański — magazyn bananów;
- dowolna lokalizacja — ofertę dobiera rekruter.

## E-mail i Excel

Wiadomość trafia wyłącznie do rekrutera wybranego z zatwierdzonej listy. Adresu nie można podmienić przez URL.

Temat zawiera status nowego kandydata, SLA 24 h, lokalizację, dane kandydata oraz nazwę rekrutera.

W treści znajduje się blok:

`DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A`

Rekruter kopiuje jeden wiersz TSV i wkleja go do pierwszej pustej komórki kolumny A wspólnego Excela. Początkowy status to `NOWY`.

## Parametry linku

Przykład zwykły:

`?lang=uk&recruiter=yana&location=siechnice&src=facebook&campaign=greenhouse_01`

Przykład dla partnera:

`?lang=ka&recruiter=oleksandr&location=siechnice&src=referral&partner=Giorgi%20Beridze&group=GE-BOLNISI`

Obsługiwane parametry:

- `lang`
- `recruiter`
- `location`
- `src`
- `campaign`
- `vacancy`
- `partner`
- `group`

## Test

```bash
npm test
```

Test sprawdza JavaScript, 20 języków, sześciu rekruterów, sześć lokalizacji, partnerów, źródła, strukturę wiadomości, 40 kolumn Excela oraz pliki interfejsu mobilnego.
