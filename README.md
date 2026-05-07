# CS340 Database Project - Team 16

Project repository for OSU CS340 Intro to Databases (Spring 2026).

## Team
- Shani Plunkett-de la Cruz
- Lon Danna

## Project
Janeway's OBGYN Association database and web UI.

This project implements a database-backed administrative web interface for managing:
- Patients
- AppointmentTypes
- Providers
- Clinics
- Appointments
- ProviderLocations (M:N intersection table)

## Repository Goals
- Track project step deliverables for CS340
- Maintain DDL and DML SQL scripts
- Build and deploy Node + Handlebars UI pages for CRUD workflows
- Collaborate via feature branch workflow

## Current Status (Step 3 Draft)
- Step 3 DML created
- Node + Handlebars app scaffold created
- Entity routes and browseable template pages created
- GitHub project issues created for Step 2 and Step 3 tracking

## Key Project Files
- `projectgroup16_step3_DRAFT/` - Step 3 web app scaffold
	- `app.js` - Express routes and server startup
	- `views/` - Handlebars template pages
	- `public/style.css` - basic styling
	- `package.json` - scripts and dependencies
- `projectgroup16_step3_DRAFT/group16_DDL.sql` - DDL + sample data
- `projectgroup16_step3_DRAFT/group16_DML.sql` - DML queries for UI workflows

## Local Development
From the Step 3 app folder:

```bash
cd projectgroup16_step3_DRAFT
npm install
npm start
```

Local URL:
- http://localhost:9116

## Run on ENGR server
For grading/review, the app should run on classwork.engr.oregonstate.edu.

## ENGR Server Deployment (for grading)
The app must be running on classwork.engr.oregonstate.edu.

Typical deployment:

```bash
git clone https://github.com/Lon20wn/cs340-database-project-team16.git
cd cs340-database-project-team16
git checkout feature-lon
cd projectgroup16_step3_DRAFT
npm install
npm run production
```

Expected URL:
- http://classwork.engr.oregonstate.edu:9116

## Branch Workflow
- `main` = stable branch
- `feature-lon` = Lon development branch
- `feature-shani` = Shani development branch

Merge to `main` only after team review/verification.

## Submission reminders
- Make sure required files are included.
- Make sure naming rules are followed.
- Post required links to Ed and Canvas.

## Code citation note
Parts of the Node/Handlebars structure and UI form layout were adapted from the CS340 starter code and Web Application Technology Exploration materials. Project-specific schema fields, page content, and entity setup were adapted for Janeway's OBGYN Association.

## AI use
If AI tools are used, include the required course citation/summary in the final submission.
