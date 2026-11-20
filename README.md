# FieldSupply — first development build

React + Vite prototype for the sprinkler company's material/tool request workflow.

## Run locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npm run dev` and open the displayed URL.
4. For a production static bundle, run `npm run build`.

## Mobile wrappers

After installing dependencies, run `npx cap add android` and/or `npx cap add ios` (iOS requires macOS/Xcode), then `npm run build && npx cap sync`. Capacitor packages the web app for native distribution. App Store/Play Store publication requires developer accounts, signing, compliance, review and testing.

## What works in this prototype

- Switch between demo accounts/roles, including a pending user and read-only delivery driver.
- Create material or tool requests with multiple line items.
- Company-wide request visibility for office/management/driver; project-limited visibility for field workers.
- Automatic read receipt when a different user opens a request.
- Office order/sent statuses separate from actual employee receipt confirmation.
- Partial receipt confirmation and outstanding quantities.
- Demo account approval/disable/role editing.
- Browser-local persistence via localStorage.

## NOT production ready

No real login, server-side authorization, Supabase connection, push notifications, supplier PDFs, employee registration, PWA service worker, or cloud synchronization are implemented. Local data is editable by the browser user and **must not** be used for real company operations. No notifications are sent. The displayed 7 AM reminder is a design placeholder. Build secure server-side role enforcement, audit logs, notification scheduler, reliable push tokens, icon assets, and production deployment before rollout. In particular, a driver must be enforced read-only at the database/API layer, not only in the UI.

## Suggested production sequence

1. Create Supabase project and configure Auth with management-approval gate.
2. Implement Postgres tables, RLS, role elevation controls, and audit events.
3. Replace localStorage with authenticated API requests.
4. Implement server-triggered new-request notifications and scheduled 7 AM notifications in the configured company timezone.
5. Implement PDF generation, storage and supplier email workflow.
6. Add installable PWA assets and offline handling; package/test with Capacitor on iOS/Android.
7. Complete security testing, backup strategy, and store submissions.
