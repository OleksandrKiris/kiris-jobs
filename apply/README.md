# Recruitment Lite — public candidate form

Public static candidate application for Kiris Jobs.

## Public URL

After GitHub Pages deploys the `main` branch:

`https://oleksandrkiris.github.io/kiris-jobs/apply/`

## What it does

1. Candidate selects one of 20 languages.
2. Candidate completes a 3-step mobile form.
3. Required fields, phone, email and age 18+ are validated locally.
4. Candidate reviews the application.
5. The page can:
   - open the candidate's email app with a prepared message (`mailto:`),
   - copy the complete application,
   - copy one TSV row for Excel,
   - download the application as a `.txt` file.
6. No candidate data is uploaded to GitHub by this form.
7. An unfinished draft is stored only in the candidate browser using `localStorage`.

## Recipient email

The recipient is configured near the top of the JavaScript in `apply/index.html`:

```js
const RECRUITER_EMAIL = "oleksandr.kiris@icloud.com";
```

Change this one value if a different recruitment mailbox should receive applications.

## Excel import

The button `Copy for Excel` copies a TAB-separated row in this fixed order:

1. ID
2. Data zgłoszenia
3. Język
4. Imię
5. Nazwisko
6. Telefon
7. Komunikator
8. E-mail
9. Obywatelstwo
10. Kraj pobytu
11. Miasto
12. Wiek
13. Stanowisko
14. Doświadczenie
15. W Polsce
16. Dokumenty
17. Gotowość
18. Praca zmianowa
19. Zakwaterowanie
20. Źródło
21. Komentarz

Paste the copied row into the first cell of an empty Excel row. Excel should split TAB values into separate columns.

## Candidate ID

Each application gets an ID like:

`KAND-20260901-113245`

The same ID is included in the email subject, message body, Excel row and TXT file.

## Supported languages

- Polish
- Ukrainian
- Russian
- English
- Georgian
- Azerbaijani
- Armenian
- Turkish
- Uzbek
- Kyrgyz
- Tajik
- Kazakh
- Hindi
- Bengali
- Nepali
- Urdu (RTL)
- Sinhala
- Filipino
- Indonesian
- Vietnamese

English is the fallback for any untranslated microcopy or option label.

## Privacy model

This is a client-side MVP. It intentionally does **not** collect passport scans, PESEL, banking data, passwords or medical files. GitHub Pages only hosts the public HTML/CSS/JavaScript. Candidate input remains in the browser until the candidate chooses to open email, copy the application or download TXT.

Important: `mailto:` does not send mail automatically. It opens the candidate's configured mail application. The candidate still has to press Send.

## Recruitment workflow

Recommended operating process:

`Public form → email → copy TSV row → recruiter Excel → call candidate → update status / next contact / decision`

Each recruiter can keep a separate Excel workbook to avoid edit conflicts on a normal file server. A later MASTER workbook can combine identically structured recruiter files with Power Query From Folder.
