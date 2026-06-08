# Janeway's OBGYN Association 🩺

Course project repository for **OSU CS340: Intro to Databases (Spring 2026)**.

Janeway's OBGYN Association is a database-backed administrative web app for managing day-to-day clinic operations.

## 🔗 Repository
[cs340-database-project-team16](https://github.com/Lon20wn/cs340-database-project-team16)

## ⚡ Quick Start

### Run Locally
From the app folder:

```bash
cd projectgroup16_FINAL
npm install
npm run development
```

Default local URL:
- http://localhost:9116

### Classwork Deployment
Typical classwork deployment flow:

```bash
git pull origin main
cd projectgroup16_FINAL
npm install
npm run production
```

If stored procedures are updated, reload SQL on the class database:

```bash
mysql -u <username> -h classmysql.engr.oregonstate.edu -p <database_name> < plsql.sql
```

## 🎯 Project Scope
The application supports CRUD workflows for:
- Patients
- Appointment Types
- Providers
- Clinics
- Appointments
- Provider Locations (M:N intersection table)

## 🧭 How to Use the App
1. Open the home page and navigate to an entity page (Patients, Providers, Appointments, etc.).
2. Use the **Create** form on that page to add a new record.
3. Use row-level **Edit** to open a pre-populated modal and save updates.
4. Use row-level **Delete** to open a confirmation modal and remove records.
5. Use **Reset Database** in the top navigation to restore baseline data from stored procedures.

### Notes for Common Workflows
- If a delete is blocked by related records, the page shows a plain-English banner explaining what dependency must be removed first.
- Appointments must be set to **Voided** before deletion (business rule enforced by stored procedure).
- Reset displays a green success banner and returns to the current page.

## 🧠 Key Design Decisions
- **Shared layout-level modals:** one reusable edit/delete modal system in `views/layouts/main.hbs` for consistent behavior across entities.
- **Friendly in-page feedback:** server redirects with query messages (`?error=`, `?success=`) rendered as banners instead of generic error pages.
- **One-time banner lifecycle:** URL params are cleaned after render to prevent stale messages on refresh.
- **Date prefill reliability:** mysql2 `dateStrings: true` plus client-side formatting ensures `date` and `datetime-local` fields pre-populate correctly.
- **Schema integrity first:** foreign-key restrictions and procedure-level rules are preserved, with clear guidance shown to users when actions are blocked.

## 🧩 Current UI Behavior
- Browse tables use consistent row-level `Edit` and `Delete` action buttons.
- `Delete` opens a confirmation modal before submitting.
- `Edit` opens a pre-populated modal form for the selected row.
- Legacy inline UPDATE/DELETE form sections are preserved in views as commented fallback blocks.

## ✅ Project Objectives
- Design and implement a normalized relational schema.
- Build a web UI that supports required CS340 CRUD workflows.
- Implement SQL-driven data access (DDL, DML, PL/SQL procedures).
- Deploy and run the application in the OSU classwork environment.

## 🧰 Tech Stack
- **Backend:** Node.js + Express
- **Templating:** Handlebars
- **Database:** MariaDB / MySQL
- **Frontend:** HTML/CSS (server-rendered pages)

## 📁 Repository Structure
- `projectgroup16_FINAL/`
	- `app.js` — Express server and route handlers
	- `database/` — DB connection logic
	- `views/` — Handlebars UI pages
	- `public/` — Static assets (CSS)
	- `package.json` — Scripts and dependencies
- `projectgroup16_FINAL/group16_DDL.sql` — Schema + sample data
- `projectgroup16_FINAL/group16_DML.sql` — Data manipulation queries
- `projectgroup16_FINAL/plsql.sql` — Stored procedures (including RESET and CUD procedures)

## 🌿 Branching Strategy
- `main` — stable branch
- `feature-lon` — Lon development work
- `feature-shani` — Shani development work

Changes are developed on feature branches and merged after review/testing.

## 📦 Documentation and Deliverables
This repository tracks SQL files, application code, and report artifacts for CS340 project step submissions.

## 👥 Teammates
- Shani Plunkett-de la Cruz
- Lon Danna

## 🐞 Report a Bug
If you find a bug or data inconsistency:
1. Open the repository's Issues tab.
2. Click **New issue**.
3. Include:
	 - Page/feature where the bug appears
	 - Steps to reproduce
	 - Expected behavior vs actual behavior
	 - Relevant error message or screenshot

## 📚 Citations and Originality
Portions of structure and patterns were adapted from CS340 starter/exploration materials. Team-authored project logic, schema design, and implementation details are documented within project files.

### AI Tools
- **Microsoft Copilot** — Used to assist in generating stored procedures (stored in `plsql.sql`).

### Course Materials
- **CS340 Introduction to Databases (Oregon State University)** — Starter code patterns for the Node.js/Express web application (`app.js`) and Handlebars view templates were adapted from CS340 course materials.
- **CS290 Web Development (Oregon State University)** — CSS styling was adapted from CS290 coursework materials.
