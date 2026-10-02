# MamaJewels dashboard integration handoff

## Existing account

The current login flow still authenticates against the existing `users` and `user_sessions` tables. The existing Owner record is not recreated or changed. Owner is the highest role; Administrator is the next administrative role.

## Connected dashboard areas

- Content reads from the configured n8n content webhook and requests media through the existing `mj-dashboard-media` webhook proxy. `/api/media/{file_id}` is intentionally public for Meta's server-side media fetch; it streams the n8n binary with its media content type. Video/Reel records use video playback and the Reel filter accepts `content_type` values `video` and `reel`.
- Approvals send only the selected DE/FR/US markets. Republish attempts for markets already marked published ask for confirmation.
- Published is read-only and lists market rows from `publish_jobs`.
- UGC reads `ugc_items` and uses the same Drive media proxy. Missing archived media is shown as unavailable instead of substituting unrelated stock imagery.
- Failures retry the stored numeric n8n execution ID through `dashboard/retry-failed-execution`, sending `x-dashboard-key` and `{ "executionId": "..." }`. The optional `N8N_RETRY_WEBHOOK_URL` overrides the default URL.
- Overview, analytics, publishing settings, integrations, and team access read/write through the Postgres schema supplied for this dashboard.
- Team invitation creates an inactive account and a one-use setup URL that expires after 24 hours. The Owner or Administrator shares that link with the invited user. The setup token is stored hashed in Postgres.

## Environment

Keep the existing server `.env` in place when deploying. Do not replace it with this source package. The application uses the configured `DB_PASSWORD` and `DASHBOARD_API_KEY`. Optional `APP_BASE_URL` ensures setup links use the public dashboard origin; `MEDIA_MANAGER_PUBLIC_URL` can explicitly set the public base URL used in media links (defaults to `https://mediamanager.mamajewels.nl`); optional `N8N_RETRY_WEBHOOK_URL` selects the retry webhook URL. The initial-owner setup endpoint also checks `MAMAJEWELS_SETUP_SECRET`; your already-configured Owner account does not need to be recreated.

## Role boundaries

- Owner and Administrator: settings, integrations, team, failures, retries, and dashboard operations.
- Editor and approver: content edits, approvals, and UGC review actions.
- Reviewer: read dashboard content and UGC, add internal UGC review notes, and view analytics. Approval stays optional and is not granted by default.
- Viewer: read-only content, UGC, published history, and analytics.

UGC review notes are stored in the existing `ugc_items.raw_payload` JSONB field and also written to `audit_log`; no schema migration is required.

## Deployment check

The source was updated locally. Before replacing the hosted copy, install locked dependencies and run the repository's build/lint scripts, then test Owner login, selected-market approval, media proxy playback, retry webhook response, and invitation setup on a staging deployment. This environment did not have project dependencies installed and could not access the network, so a production build was not verified here.
