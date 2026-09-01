# Recruitment Lite 3.0 — formularz kandydata

Publiczna, statyczna ankieta rekrutacyjna dla PPO Siechnice. Nie wymaga serwera aplikacyjnego ani bazy danych.

## Adres publiczny

Po poprawnym wdrożeniu GitHub Pages:

`https://oleksandrkiris.github.io/kiris-jobs/apply/`

## Przebieg dla kandydata

1. Kandydat otwiera jeden publiczny link na telefonie.
2. Wybiera jeden z 20 języków.
3. Obowiązkowo wybiera rekrutera.
4. Wypełnia trzy krótkie etapy ankiety.
5. Sprawdza dane i adres odbiorcy.
6. Naciska `Otwórz pocztę i wyślij`.
7. Telefon otwiera aplikację pocztową z gotową wiadomością do wybranego rekrutera.
8. Kandydat sam naciska `Wyślij` w swojej poczcie.

Formularz nie może wysłać wiadomości samodzielnie, ponieważ działa wyłącznie jako statyczna strona GitHub Pages.

## Rekruterzy i routing

Lista znajduje się w pliku [`config.js`](config.js). Dozwoleni odbiorcy:

| ID linku | Rekruter | E-mail |
|---|---|---|
| `yana` | Yana Radushynska | `yana.radushynska@pposiechnice.pl` |
| `yuliia` | Yuliia Korniienko | `yuliia.korniienko@pposiechnice.pl` |
| `fariz` | Fariz Injaev | `fariz.injaev@pposiechnice.pl` |
| `oleksandr` | Oleksandr Kiris | `oleksandr.kiris@pposiechnice.pl` |
| `maksym` | Maksym Saliuk | `maksym.saliuk@pposiechnice.pl` |
| `anastasiia` | Anastasiia Derepa | `anastasiia.derepa@citronex.pl` |

Adres e-mail nie jest pobierany bezpośrednio z parametrów URL. Parametr może wskazać wyłącznie ID z zamkniętej listy w `config.js`, dlatego nie można podmienić odbiorcy na dowolny adres.

Kandydat zawsze widzi ekran wyboru i musi nacisnąć kartę rekrutera. Parametr w linku jedynie oznacza osobę jako polecaną.

Przykład:

```text
https://oleksandrkiris.github.io/kiris-jobs/apply/?lang=uk&recruiter=yana&src=facebook_ukraine&campaign=greenhouse_01
```

Obsługiwane parametry:

- `lang` — sugerowany język;
- `recruiter` — sugerowany rekruter;
- `src` — źródło linku;
- `campaign` — nazwa kampanii;
- `vacancy` — kod lub nazwa oferty.

## Wiadomość e-mail

Temat zawiera:

- unikalne ID;
- imię i nazwisko;
- obywatelstwo;
- stanowisko;
- nazwisko wybranego rekrutera.

Treść jest zawsze uporządkowana po polsku, niezależnie od języka formularza. Odpowiedzi wpisane przez kandydata nie są tłumaczone ani zmieniane.

Wiadomość zawiera również pojedynczy wiersz TSV do Excela. Rekruter kopiuje ten wiersz i wkleja go do pierwszej pustej komórki swojego pliku Excel.

## Kolejność kolumn Excel

Stała kolejność jest zdefiniowana w `config.js`:

1. ID zgłoszenia
2. Data zgłoszenia
3. Język
4. Rekruter
5. E-mail rekrutera
6. Imię
7. Nazwisko
8. Telefon
9. Komunikator
10. E-mail kandydata
11. Obywatelstwo
12. Kraj pobytu
13. Miasto
14. Wiek
15. Stanowisko
16. Doświadczenie
17. W Polsce
18. Dokumenty
19. Gotowość
20. Praca zmianowa
21. Zakwaterowanie
22. Źródło deklarowane
23. Źródło linku
24. Kampania
25. Wakacja / oferta
26. Komentarz
27. Status
28. Pierwszy kontakt
29. Następny kontakt
30. Decyzja
31. Uwagi rekrutera

Początkowy status każdej nowej pozycji to `NOWY`.

## Języki

Formularz obsługuje 20 języków:

- polski;
- ukraiński;
- rosyjski;
- angielski;
- gruziński;
- azerski;
- ormiański;
- turecki;
- uzbecki;
- kirgiski;
- tadżycki;
- kazachski;
- hindi;
- bengalski;
- nepalski;
- urdu z układem RTL;
- syngaleski;
- filipiński;
- indonezyjski;
- wietnamski.

Angielski jest bezpiecznym fallbackiem dla brakującego drobnego komunikatu.

## Prywatność i bezpieczeństwo

- GitHub przechowuje wyłącznie publiczny kod strony.
- Dane ankiety nie są zapisywane w repozytorium.
- Niedokończony formularz jest przechowywany lokalnie w przeglądarce kandydata przez `localStorage`.
- Odbiorca wiadomości pochodzi wyłącznie z zamkniętej listy rekruterów.
- Formularz nie zbiera skanów paszportu, PESEL, danych bankowych, haseł ani dokumentacji medycznej.
- Parametry kampanii są filtrowane i ograniczone długością.
- Dane w wierszu Excel są czyszczone z tabulatorów i znaków nowej linii.

Link do informacji o prywatności jest ustawiony w `config.js`. Przed pełnym użyciem produkcyjnym treść i właściwy dokument rekrutacyjny powinien zatwierdzić Inspektor Ochrony Danych lub dział prawny.

## Pliki

- `index.html` — struktura ekranów;
- `styles.css` — responsywny wygląd;
- `config.js` — rekruterzy, adresy, kolumny Excel i ustawienia;
- `i18n-core.js` — języki podstawowe i polskie wartości wewnętrzne;
- `i18n-caucasus-central.js` — Kaukaz i Azja Centralna;
- `i18n-asia.js` — Azja Południowa i Południowo-Wschodnia;
- `app.js` — walidacja, wybór rekrutera, mailto, schowek, udostępnianie, TXT i localStorage;
- `scripts/validate-apply.mjs` — kontrola konfiguracji przed publikacją.

## Testy

Repozytorium uruchamia w GitHub Actions:

```bash
npm test
```

Test sprawdza między innymi:

- składnię wszystkich plików JavaScript;
- dokładnie sześciu rekruterów i poprawność ich adresów;
- unikalność ID i e-maili rekruterów;
- co najmniej 20 języków;
- obecność wymaganych kluczy tłumaczeń;
- obecność ekranu wyboru rekrutera;
- podłączenie wszystkich plików do `index.html`.

## Model pracy zespołu

```text
Publiczna ankieta
→ kandydat wybiera język
→ kandydat wybiera rekrutera
→ e-mail trafia bezpośrednio do wybranej osoby
→ rekruter kopiuje wiersz TSV
→ wkleja do własnego pliku Excel
→ telefonuje i aktualizuje status, następny kontakt, decyzję oraz notatki
```

Każdy rekruter może pracować we własnym pliku Excel na serwerze plików. Wszystkie pliki powinny mieć identyczne kolumny, aby później można było połączyć je w pliku MASTER przez Power Query `Z folderu`.
