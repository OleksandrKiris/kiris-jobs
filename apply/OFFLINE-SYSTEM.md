# Offline recruitment workflow

## Candidate flow

1. Open the public form, choose a language and exactly one recruiter.
2. Complete the form once and add document photos or source files.
3. The phone creates a Polish PDF dossier, candidate Excel file, exact message text, Excel row and renamed original documents.
4. Tap the main send button once. On supported phones the system share panel opens with the PDF, Excel and original documents already selected as separate files.
5. Choose Email, WhatsApp, Viber, Telegram or another installed application.
6. If file sharing is not supported, download the PDF and Excel, open the required channel and attach the downloaded files manually.

## PDF dossier

The dossier filename contains the candidate name, surname and date of birth. It contains:

- cover page with ApplicationID and recruiter;
- Polish CV;
- candidate application;
- document register;
- one labelled page for every uploaded document image;
- candidate name, date of birth and ApplicationID in the footer of every page.

PDF, DOC and DOCX source files are listed in the dossier and sent separately in their original format. They are not silently converted, so the source quality is preserved.

## Recruiter flow

1. Save the received PDF, Excel and original documents under the generated candidate name.
2. Paste the exact row into the first free row of `Candidates`.
3. Contact the candidate and update the status.
4. During the video call fill `Interview`.
5. Copy the green call row to `Calls` and update `Candidates`.
6. Transfer approved candidates to `Recruitment_Master.xlsx`.

## Delivery limitation

Web browsers cannot automatically attach local files through `mailto:`, WhatsApp or Viber deep links. The supported one-tap file path is the phone system share panel. Direct channel buttons open the selected recruiter and exact message text; files must be attached manually only when the system share panel is unavailable.

## Internal archive

A ZIP archive is still generated internally for backup and recovery, but it is not the primary user-facing delivery format.

## Rules

- One candidate submits one application to one recruiter.
- A repeated application is created only when the same recruiter requests a new version.
- One candidate equals one ApplicationID and one CandidateKey.
- Recruiters work in Excel after receiving the files.
- Documents remain local until the user explicitly shares them.
