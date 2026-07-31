# Project Evergreen

Wedding website for **Emma Everett & Joe Toker**  
**Saturday 24 July 2027 · The Beverley Barn, Beverley**

## What is included

- Guest-mode “Open Invitation” screen
- Rustic Yorkshire meadow-inspired design
- Modern luxury typography and styling
- Responsive desktop and mobile layouts
- Live countdown
- Wedding details, story, timeline, venue, accommodation, gifts and FAQ
- RSVP form with a confetti thank-you screen
- Personalised guest links such as `?guest=John`
- Hidden Project Evergreen preview panel via the leaf in the footer

## Important: RSVP form in Version 1

The form currently saves demonstration responses in the visitor's own browser using `localStorage`. It does **not yet send responses to you**.

The next version can connect the exact same form to Google Sheets using Google Apps Script. Do not send the website to guests until that connection has been added and tested.

## Upload to GitHub

1. Download and unzip `project-evergreen-v1.zip`.
2. Open the GitHub repository you created.
3. Select **Add file** → **Upload files**.
4. Drag these items into the upload area:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
   - the `assets` folder
5. Enter a message such as `Upload Project Evergreen v1`.
6. Select **Commit changes**.

## Turn on GitHub Pages

1. In the repository, select **Settings**.
2. Choose **Pages** in the left-hand menu.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Select the `main` branch and `/ (root)`.
5. Select **Save**.
6. GitHub will display the live website address after a few minutes.

It normally looks like:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/`

## Preview locally

Double-click `index.html` to open it in a browser. Most features work locally, although publishing through GitHub Pages is the best test.

## Edit the text

Open `index.html` in a basic editor such as Notepad or Visual Studio Code.

Useful searches:

- `Our favourite chapter begins here` — change the story
- `Guest arrival` — change timeline entries
- `children policy` — update the FAQ
- `Your presence is our present` — change gift wording

## Edit the colours

Open `styles.css` and change the values at the top under `:root`.

## Reset the invitation while testing

The welcome screen is shown once per browser tab/session. Close the tab and open the site again, or clear the browser's session storage.

## Next recommended upgrade

Connect the RSVP form to Google Sheets, add the confirmed schedule, replace accommodation placeholders and add real photographs.
