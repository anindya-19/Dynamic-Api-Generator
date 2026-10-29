# Dynamic API Generator

VibeAPI Builder is a browser-based tool for turning a plain-language description into a REST API data model. Explore the generated schema, try CRUD operations against an in-memory data store, inspect example API documentation, and copy a standalone Express.js server template.

## Features

- **Natural-language schema generation:** Describe an API and use Gemini to generate an entity, endpoint path, typed fields, validation metadata, and sample records. Quick-start prompts are included for employee management, inventory, ticketing, and patient records.
- **Fallback schemas:** The app remains usable when Gemini is not configured or a request fails, using built-in sample schemas.
- **Schema viewer:** Review field types, required flags, validation rules, defaults, and copy the generated schema as JSON.
- **Interactive API playground:** Try `GET` collection, `GET` by ID, `POST`, `PUT`, and `DELETE` operations. Edit request bodies, inspect response codes and JSON, and view or reset the in-memory records.
- **API examples:** Browse endpoint descriptions and copy cURL and JavaScript Fetch examples.
- **Express export:** Copy a standalone Node.js/Express CRUD server template populated with the current schema and sample data.

## Tech stack

- React 19 and Vite
- Tailwind CSS 4 and Lucide React
- Google Gemini API, called with `fetch`
- Browser-side React state for the simulated database

## Getting started

### Requirements

- Node.js and npm
- A Google Gemini API key to enable AI-generated schemas (optional; built-in fallback schemas work without one)

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

### Configure Gemini (optional)

Create a `.env.local` file in the project root and add your Gemini API key:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Restart the Vite development server after changing environment variables. The app sends schema-generation requests to the Gemini 2.5 Flash API. Without a working key, the app uses built-in fallback schemas.

> **Security:** Vite exposes `VITE_` variables to browser code. Do not use a privileged or unrestricted API key in a public deployment. For production, make Gemini requests through a server-side endpoint and keep the key on the server.

## Using the app

1. Enter an API description or choose one of the example prompts, then select **Generate API**.
2. Review the generated model and JSON schema in **Data Model & Validation**.
3. Use **API Playground** to select a CRUD operation, provide an ID or request body as needed, and send a test request. The response inspector shows the status and JSON result; the database view lets you inspect or reset records.
4. Open **API Docs & cURL** to copy example requests, or **Express.js Code Export** to copy the generated server template.

The playground data exists only in browser memory. It is not persisted, and refreshing the page restores the initial sample state. The playground simulates API calls; it does not start a backend server.

## Generated Express server

The exported code is a template for a separate Node.js server; it is not run by this Vite app. Copy the output into your own project, install its dependencies, and run it there. The template uses Express and CORS and stores records in memory, so its data is also temporary.

## Project scripts

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
npm run lint     # Run Oxlint
```
