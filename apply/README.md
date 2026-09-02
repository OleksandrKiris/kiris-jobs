# Citronex / PPO Siechnice — prosta ankieta rekrutacyjna

## Linki produkcyjne

- Ankieta: `https://oleksandrkiris.github.io/kiris-jobs/apply/`
- Opcjonalny generator PDF: `https://oleksandrkiris.github.io/kiris-jobs/apply/pdf/`

## Jak działa ankieta

1. Kandydat wybiera język.
2. Wybiera jednego rekrutera.
3. Podaje podstawowe dane, lokalizację pracy i źródło kontaktu.
4. Sprawdza zgłoszenie.
5. Naciska **„Otwórz e-mail i wyślij wiersz”**.
6. Otwiera się aplikacja pocztowa z odbiorcą i jedną linią TSV do wspólnego Excela.
7. Kandydat sam naciska **Wyślij**.

Główna ankieta **nie tworzy CV, nie przyjmuje plików i nie generuje PDF**. Dzięki temu działa szybko na telefonie i nie miesza dwóch różnych procesów.

## Wiersz Excel

Wiadomość zawiera tylko krótką instrukcję po polsku i jeden wiersz rozdzielony tabulatorami. Rekruter kopiuje wiersz do pierwszej pustej komórki kolumny A wspólnego Excela. Układ zachowuje 40 kolumn dotychczasowej kolejki, a pola operacyjne zaczynają się od statusu `NOWY`.

## Generator PDF

Generator pod `/apply/pdf/` jest osobną, opcjonalną funkcją. Można w nim przygotować PDF, arkusz Excel i pakiet dokumentów, ale nie jest potrzebny do wysłania zwykłej ankiety.

---

# Русская инструкция

Основная анкета и генератор PDF разделены.

- Анкета: `https://oleksandrkiris.github.io/kiris-jobs/apply/`
- Отдельный генератор PDF: `https://oleksandrkiris.github.io/kiris-jobs/apply/pdf/`

Основная анкета не создаёт CV, не загружает документы и не формирует PDF. После заполнения открывается почта выбранного рекрутера, а в письме находится одна строка TSV для вставки в общий Excel. Генератор PDF используется отдельно и только при необходимости.
