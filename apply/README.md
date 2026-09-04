# Citronex / PPO Siechnice — prosta ankieta rekrutacyjna

## Linki produkcyjne

- Ankieta: `https://oleksandrkiris.github.io/kiris-jobs/apply/`
- Opcjonalny generator PDF: `https://oleksandrkiris.github.io/kiris-jobs/apply/pdf/`

## Jak działa ankieta

1. Kandydat wybiera język.
2. Wybiera jednego rekrutera.
3. W trzech krótkich krokach podaje kontakt, narodowość, płeć, wiek, lokalizację, planowany okres przyjazdu i odpowiedzi dotyczące realnych warunków pracy.
4. Sprawdza zgłoszenie.
5. Naciska **„Otwórz e-mail i wyślij wiersz”**.
6. Otwiera się aplikacja pocztowa z odbiorcą i jedną linią TSV do wspólnego Excela.
7. Kandydat sam naciska **Wyślij**.

Główna ankieta **nie tworzy CV, nie przyjmuje plików i nie generuje PDF**. Dzięki temu działa szybko na telefonie i nie miesza dwóch różnych procesów.

## Wiersz Excel

Wiadomość zawiera tylko krótką instrukcję po polsku i jeden wiersz rozdzielony tabulatorami. Rekruter kopiuje wiersz do pierwszej pustej komórki kolumny A wspólnego Excela.

Wiersz ma 12 kolumn zgodnych z roboczą tabelą zespołu:

1. dane osobowe, telefon i komunikator;
2. narodowość;
3. płeć;
4. wiek;
5. lokalizacja;
6. planowany okres przyjazdu;
7. doświadczenie w pracy fizycznej;
8. wskaźniki wydajności, jakości i szybkie tempo;
9. filmy oraz zrozumienie warunków pracy;
10. doświadczenie w pracy po 10–12 godzin;
11. ocena rekrutera — pozostaje pusta;
12. decyzja — pozostaje pusta.

Pola `UWAGI`, `wideorozmowa`, `Czy jest ogarnięty?` i decyzja są oceną wewnętrzną. Kandydat ich nie widzi i nie wypełnia.

## Generator PDF

Generator pod `/apply/pdf/` jest osobną, opcjonalną funkcją. Można w nim przygotować PDF, arkusz Excel i pakiet dokumentów, ale nie jest potrzebny do wysłania zwykłej ankiety.

---

# Русская инструкция

Основная анкета и генератор PDF разделены.

- Анкета: `https://oleksandrkiris.github.io/kiris-jobs/apply/`
- Отдельный генератор PDF: `https://oleksandrkiris.github.io/kiris-jobs/apply/pdf/`

Основная анкета не создаёт CV, не загружает документы и не формирует PDF. Она состоит из трёх коротких шагов и собирает только данные из рабочей таблицы рекрутеров. После заполнения открывается почта выбранного рекрутера, а в письме находится одна строка TSV из 12 колонок для вставки в общий Excel. Последние две служебные колонки остаются пустыми. Генератор PDF используется отдельно и только при необходимости.
