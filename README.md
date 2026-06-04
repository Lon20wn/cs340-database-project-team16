# Janeway's OBGYN Association Database Project

Course project repository for **OSU CS340: Intro to Databases (Spring 2026)**.

## Team
- Shani Plunkett-de la Cruz
- Lon Danna

## Project Overview
This project is a database-backed administrative web application for managing operations at Janeway's OBGYN Association.

The application supports core data management for:
- Patients
- Appointment Types
- Providers
- Clinics
- Appointments
- Provider Locations (M:N intersection table)

## Objectives
- Design and implement a normalized relational schema.
- Build a web UI that supports required CS340 CRUD workflows.
- Implement SQL-driven data access (DDL, DML, PL/SQL procedures).
- Deploy and run the application in the OSU classwork environment.

## Tech Stack
- **Backend:** Node.js + Express
- **Templating:** Handlebars
- **Database:** MariaDB / MySQL
- **Frontend:** HTML/CSS (server-rendered pages)

## Repository Structure
- `projectgroup16_step3_DRAFT/`
	- `app.js` — Express server and route handlers
	- `database/` — DB connection logic
	- `views/` — Handlebars UI pages
	- `public/` — Static assets (CSS)
	- `package.json` — Scripts and dependencies
- `projectgroup16_step3_DRAFT/group16_DDL.sql` — Schema + sample data
- `projectgroup16_step3_DRAFT/group16_DML.sql` — Data manipulation queries
- `projectgroup16_step3_DRAFT/plsql.sql` — Stored procedures (including RESET and CUD procedures)

## Running the App Locally
From the app folder:

```bash
cd projectgroup16_step3_DRAFT
npm install
npm run development
```

Default local URL:
- http://localhost:9116

## Deployment Notes (Classwork)
Typical classwork deployment flow:

```bash
git pull origin main
cd projectgroup16_step3_DRAFT
npm install
npm run production
```

If procedures are updated, reload SQL on the class database:

```bash
mysql -u <username> -h classmysql.engr.oregonstate.edu -p <database_name> < plsql.sql
```

## Branching Strategy
- `main` — stable branch
- `feature-lon` — Lon development work
- `feature-shani` — Shani development work

Changes are developed on feature branches and merged after review/testing.

## Documentation and Deliverables
This repository tracks the SQL files, application code, and report artifacts needed for CS340 project step submissions.

## Citations and Originality
Portions of structure and patterns were adapted from CS340 starter/exploration materials. Team-authored project logic, schema design, and implementation details are documented within project files.

### AI Tools
- **Microsoft Copilot** — Used to assist in generating stored procedures (stored in `plsql.sql`).

### Course Materials
- **CS340 Introduction to Databases (Oregon State University)** — Starter code patterns for the Node.js/Express web application (`app.js`) and Handlebars view templates were adapted from CS340 course materials.
- **CS290 Web Development (Oregon State University)** — CSS styling was adapted from CS290 coursework materials.
