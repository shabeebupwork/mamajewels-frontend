# MamaJewels Content Operations Dashboard

This folder contains the frontend source code for the MamaJewels Instagram content automation dashboard.

## Included

- Login screen and dashboard shell
- Overview metrics and recent activity
- Content library with market previews for NL, DE, FR, and US
- Content editing, filtering, sorting, and approval controls
- Published-content and UGC library views
- Failure monitoring and simplified analytics
- Team-management interface
- Settings for international publishing, human approval, and integration health
- Double confirmation before human approval can be disabled

## Technology

- React 19
- Next.js 16 / Vinext
- TypeScript
- Tailwind CSS
- Recharts and Lucide icons

## Local setup

Node.js 22.13 or newer is required.

```bash
npm ci
npm run dev
```

For a production build:

```bash
npm run build
npm run start
```

## Current implementation status

The interface is a working frontend prototype. It currently uses local demonstration data and a client-side demonstration login so the complete user experience can be reviewed before backend integration.

Before production launch, the developer should:

1. Replace demonstration content, metrics, UGC, failures, users, and settings with backend API responses.
2. Connect dashboard reads to the dashboard-data n8n workflow/API.
3. Connect approvals, edits, retries, and settings changes to the dashboard-actions n8n workflow/API.
4. Implement secure server-side authentication, sessions, password storage, and role-based permissions.
5. Keep n8n credentials and internal API keys on the server. They must never be exposed in browser code.
6. Add final loading, empty, validation, and API-error states after the live endpoints are connected.

The prefilled login details are for demonstration only and are not production credentials.

## Recommended deployment structure

- Dashboard: this application on the MamaJewels server
- Automation: self-hosted n8n on the DigitalOcean server
- Database: PostgreSQL on the server
- Media library: Google Drive
- Publishing and account data: Meta Graph API
- Optional discovery fallback: Apify only where Meta does not expose the required UGC data

UGC remains review-only and must never be automatically republished. International versions of original NL content can be published automatically only when the approval requirement is deliberately disabled in Settings.
