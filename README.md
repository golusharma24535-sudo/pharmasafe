# PharmaSafe — Medicine Stock & Expiry Tracker

A beginner-friendly student prototype built with HTML, CSS and JavaScript. Inventory records are saved in the current browser using `localStorage`.

## Files
- `index.html` — page structure
- `style.css` — layout and responsive styling
- `script.js` — inventory logic, expiry alerts, filters and CSV export

## Run locally
1. Extract the ZIP into a folder.
2. Open `index.html` in Chrome, or open the folder in VS Code / PyCharm.
3. For a smoother local development workflow, use the editor's local server / Live Server feature if available.
4. Click **Load sample data** to explore demo records.
5. Add, edit, search, filter, delete and export records to CSV.

## Important limitations
- `localStorage` is browser- and device-specific. It is not a cloud database, has no shared users, and can be cleared by browser settings.
- This is a student demonstration, not validated pharmacy-management software. Do not enter real patient information.
- Sample records are synthetic and marked DEMO. Do not use them for actual stock decisions.
- Expiry calculations use the computer's local date. Verify inventory manually.
- No login or access control is included.

## Before presenting
1. Test all features in the browser.
2. Capture screenshots of the dashboard, adding a record, expiry filter and CSV export.
3. Ask pharmacy staff or faculty for feedback; report only genuine findings.
4. Research existing inventory tools and explain the specific gap your version addresses.
5. Check the official Innovative Bharat 4.0 rules, deadlines, eligibility, team requirements, fees and required submission format directly with the organizers. This code does not imply selection or eligibility.

## Suggested next improvements
- Form validation and usability testing with synthetic data.
- A short project report and slide deck.
- Later, if needed, a secure backend with authentication, backups and role-based access (not included in this prototype).
