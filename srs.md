ted content
38.85 KB •685 lines
•
Formatting may be inconsistent from source
# Software Requirements Specification
### MoveThisOut — PWA Moving Marketplace
**Version:** 1.0
**Status:** Draft
**Date:** June 2026

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document describes the complete functional and non-functional requirements for MoveThisOut, a Progressive Web Application that connects individuals who need items moved with independent movers. This document is intended for use by developers, designers, QA engineers, and project stakeholders involved in the design, development, and testing of the system.

### 1.2 Scope

MoveThisOut is a two-sided marketplace PWA. The system allows requesters to post move jobs, receive instant price quotes, track moves in real time, and rate movers. It allows movers to apply to the platform, browse a live request center, claim jobs, execute moves with in-app guidance, and receive payouts. An admin interface provides full operational oversight. The system is web-based, installable on iOS and Android as a PWA, and built entirely on Supabase as the backend infrastructure.

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|-----------|
| PWA | Progressive Web Application — a web app installable on device home screens |
| Requester | A registered user who posts move jobs |
| Mover | A registered, verified driver who claims and executes move jobs |
| Admin | Internal platform operator with full system access |
| Job | A single move request from pickup address to drop-off address |
| Request Center | The live feed of open jobs visible to all online movers |
| RLS | Row Level Security — PostgreSQL access control at the row level |
| SRS | Software Requirements Specification |
| JWT | JSON Web Token — used for authentication |
| VAPID | Voluntary Application Server Identification — used for Web Push |
| GMV | Gross Merchandise Value — total transaction value through the platform |
| Edge Function | Supabase serverless function running on Deno at the edge |

### 1.4 Overview of Document

Section 2 gives the overall product description. Section 3 covers functional requirements per user role. Section 4 covers external interface requirements. Section 5 covers non-functional requirements. Section 6 covers system constraints. Section 7 covers the data model. Section 8 covers security requirements. Section 9 defines out-of-scope items.

---

## 2. Overall Description

### 2.1 Product Perspective

MoveThisOut is a standalone web platform. It does not integrate with any existing moving company systems. It operates as an independent marketplace. The frontend is a single React PWA served from Vercel. All backend services — authentication, database, realtime communication, file storage, and serverless logic — are provided by Supabase. External dependencies are limited to Google Maps Platform and Resend for email.

### 2.2 Product Functions Summary

- User registration and role-based authentication
- Multi-step move job creation with item inventory
- Automated price quoting based on distance, items, and time
- Real-time request center with live job feed for movers
- Atomic job claiming with race condition protection
- Step-by-step active job flow for movers
- Live GPS tracking for requesters during an active move
- Completion verification via photo upload and e-signature
- Push notifications for key job lifecycle events
- Review and rating system
- Admin dashboard for mover approval, job monitoring, and revenue reporting
- PWA install, offline support, and screen wake lock

### 2.3 User Classes and Characteristics

**Requester**
A general member of the public who needs items transported. No technical background assumed. Uses the app primarily on a mobile phone. Interacts with the system at the point of booking and during the move. May use the app infrequently.

**Mover**
An independent driver with a vehicle. Uses the app daily while working. Needs reliable real-time connectivity during active jobs. More technically engaged than a requester. Must pass an admin approval process before gaining full access.

**Admin**
Internal platform staff. Uses the admin dashboard primarily on a desktop browser. Responsible for mover approvals, dispute resolution, and platform monitoring. Has unrestricted access to all data.

### 2.4 Operating Environment

- **Client devices:** Any modern smartphone or desktop browser. Primary targets are iOS Safari 16.4+ and Android Chrome 90+.
- **Network:** Designed to function in variable mobile network conditions. Critical actions queue and retry when offline.
- **PWA runtime:** Installed to home screen on iOS and Android. Runs in standalone display mode with no browser chrome.
- **Backend:** Supabase cloud (hosted on AWS infrastructure). Edge Functions run on Deno Deploy.
- **Frontend hosting:** Vercel CDN with global edge distribution.

### 2.5 Design and Implementation Constraints

- The entire backend must run on Supabase. No separate Node.js server or container deployment.
- All client-facing pages must be responsive and functional on screens 375px wide and above.
- The system must work without a native app. All device features (GPS, camera, push) must use PWA browser APIs.
- The Google Maps Distance Matrix API key must never be exposed to the browser. It must only be called from Edge Functions.
- Row Level Security must be enabled and enforced on every database table. Application-layer access control alone is not sufficient.
- All file uploads go directly from the browser to Supabase Storage. Files do not pass through Edge Functions.

### 2.6 Assumptions and Dependencies

- Users have a device capable of running a PWA (iOS 16.4+ or Android with Chrome).
- Movers have a smartphone with GPS capability and keep the screen on during active jobs.
- Push notifications on iOS require the user to have installed the PWA to their home screen.
- Google Maps Platform APIs are available and the project has sufficient quota.
- Supabase Realtime is available and stable for the expected concurrent connection count.
- Admin manually reviews mover documents. No automated background check service is used in this version.

---

## 3. Functional Requirements

### 3.1 Authentication and Onboarding

#### 3.1.1 Requester Registration

**FR-101** The system shall allow a new user to register as a requester by providing full name, email address, phone number, and password.

**FR-102** The system shall send an email verification link upon registration. The user shall not be able to create a job until their email is verified.

**FR-103** On successful email verification, the system shall automatically create a profile record for the user with role set to requester.

**FR-104** The system shall validate that the email address provided is unique across all registered users.

**FR-105** The system shall enforce a minimum password length of 8 characters.

#### 3.1.2 Mover Registration

**FR-106** The system shall allow a new user to register as a mover by providing full name, email address, phone number, and password.

**FR-107** After email verification, the mover shall be directed to a mover application form before gaining access to any other mover features.

**FR-108** The mover application form shall collect: vehicle type (cargo van, small truck, large truck), vehicle capacity in cubic metres, service radius in kilometres, home base address, and document uploads (driver's licence, vehicle registration).

**FR-109** On submission of the mover application, the mover's status shall be set to pending. The mover shall see a pending approval screen on all subsequent logins until approved.

**FR-110** The system shall notify the admin of a new mover application via email.

#### 3.1.3 Login and Session Management

**FR-111** The system shall authenticate registered users with email and password.

**FR-112** The system shall issue a JWT access token valid for 1 hour and a refresh token valid for 7 days on successful login.

**FR-113** The Supabase JS client shall silently refresh the access token before expiry. The user shall not be logged out mid-session due to token expiry.

**FR-114** The system shall redirect users to their role-appropriate home screen after login. A requester lands on `/app/dashboard`, a mover on `/mover/dashboard`, an admin on `/admin/dashboard`.

**FR-115** The system shall invalidate both tokens on logout and redirect the user to the login page.

**FR-116** A user with a suspended account shall be prevented from logging in and shown an appropriate message.

---

### 3.2 Requester Features

#### 3.2.1 Requester Dashboard

**FR-201** The requester dashboard shall display a list of all their jobs, sorted by scheduled date descending, showing status, price, and mover name if assigned.

**FR-202** The requester shall be able to tap any job in the list to view its full detail.

**FR-203** The requester shall be able to initiate a new job from the dashboard.

#### 3.2.2 Job Creation

**FR-204** Job creation shall be a multi-step form with the following steps in order: addresses, date and time, item inventory, review and confirm.

**FR-205** The pickup address and drop-off address fields shall use Google Maps Places Autocomplete to assist the user in entering valid addresses. Both fields shall capture the full address string and the corresponding latitude and longitude coordinates.

**FR-206** The user shall select a preferred move date using a date picker. Dates in the past shall not be selectable.

**FR-207** The user shall select a preferred time window from three options: morning (8am–12pm), afternoon (12pm–5pm), evening (5pm–8pm).

**FR-208** The item inventory step shall allow the user to add one or more items. Each item shall have a name (text), size category (small, medium, large, extra large), quantity (integer, minimum 1), and an optional photo.

**FR-209** The user shall be able to add, edit, and remove items before proceeding to the review step.

**FR-210** At the review step, the system shall call the calculate-price Edge Function and display the quoted price, estimated distance, and a breakdown of the cost to the user before they confirm.

**FR-211** The user shall be able to go back and edit any previous step from the review screen without losing already-entered data.

**FR-212** On confirmation, the system shall collect payment (method TBD), create the job record with status open, and redirect the user to the job detail page.

**FR-213** A job with status draft shall not be visible in the request center. It becomes visible only after payment confirmation sets it to open.

#### 3.2.3 Job Tracking

**FR-214** The job detail page shall show current status, mover details (name, phone, vehicle type, rating) once claimed, scheduled time, pickup and drop-off addresses, item list, and price.

**FR-215** When the job status is in_progress, a live tracking map shall be shown on the job detail page displaying the mover's current location as a pin on a Google Map.

**FR-216** The mover's location pin on the map shall update in real time as the mover emits GPS coordinates, without requiring a page refresh.

**FR-217** A status timeline shall be displayed on the tracking page showing all lifecycle stages and the timestamps at which each was reached.

**FR-218** The requester shall receive a push notification when: a mover claims their job, the mover is in progress, and the job is completed.

#### 3.2.4 Job Cancellation

**FR-219** The requester shall be able to cancel a job from the job detail page if the job status is draft or open.

**FR-220** Once a job reaches claimed or beyond, the requester shall not be able to self-cancel. They must contact admin.

**FR-221** On cancellation the job status shall be set to cancelled. Refund policy is TBD and shall be handled by admin manually in this version.

#### 3.2.5 Reviews

**FR-222** After a job reaches completed status, the requester shall be prompted to leave a review for the mover.

**FR-223** A review shall consist of a star rating from 1 to 5 and an optional text comment.

**FR-224** A requester may submit only one review per completed job.

**FR-225** Once submitted, a review cannot be edited or deleted by the requester.

---

### 3.3 Mover Features

#### 3.3.1 Mover Dashboard

**FR-301** The mover dashboard shall display: current online/offline toggle status, today's claimed job if any, total completed jobs, current average rating, and recent earnings history.

**FR-302** A mover with pending status shall only see a pending approval screen. No other mover features shall be accessible.

**FR-303** A mover with suspended status shall be shown a suspension message on login and denied access to all mover features.

#### 3.3.2 Online / Offline Toggle

**FR-304** The mover dashboard shall display a prominent online/offline toggle switch.

**FR-305** When a mover sets themselves online, the system shall update `mover_profiles.is_online` to true and subscribe their browser session to the Supabase Realtime request center channel.

**FR-306** When a mover sets themselves offline, the system shall update `mover_profiles.is_online` to false and unsubscribe from the realtime channel. New job notifications shall cease.

**FR-307** If a mover's browser session disconnects unexpectedly, the system shall not automatically set them offline. Their is_online status remains as set until they explicitly toggle it or an admin changes it.

#### 3.3.3 Request Center

**FR-308** The request center shall display all jobs with status open as a scrollable list of job cards.

**FR-309** Each job card shall display: pickup suburb, drop-off suburb, distance in km, scheduled date and time window, total item count with a size breakdown, and mover payout amount.

**FR-310** The request center shall update in real time. When a new job is posted, its card shall appear at the top of the list without a page refresh, via Supabase Realtime postgres_changes subscription.

**FR-311** When a job is claimed by any mover, it shall be removed from the request center list for all movers immediately, via Supabase Realtime.

**FR-312** The mover shall be able to filter the request center by scheduled date, minimum and maximum distance, and vehicle size required.

**FR-313** The mover shall be able to tap a job card to view the full job detail before deciding to claim it.

**FR-314** The full job detail view shall show complete pickup and drop-off addresses, the full item list with any item photos, all notes from the requester, and the calculated payout.

#### 3.3.4 Job Claiming

**FR-315** A claim button shall be present on the full job detail view for any open job.

**FR-316** When the mover taps claim, the system shall call the claim-job Edge Function.

**FR-317** The claim-job Edge Function shall perform an atomic database update that sets status to claimed only if the current status is still open. If two movers attempt to claim simultaneously, only the first shall succeed.

**FR-318** The mover who successfully claims shall be taken to the active job view.

**FR-319** A mover who attempts to claim a job that was just claimed by another shall receive a clear message informing them the job is no longer available.

**FR-320** A mover may only have one job in claimed or in_progress status at a time. The claim button shall be disabled if they already have an active job.

#### 3.3.5 Active Job Flow

**FR-321** The active job view shall present the mover with a sequential set of steps: navigate to pickup, confirm arrival, confirm loading complete, navigate to drop-off, confirm delivery, complete job.

**FR-322** Each step shall have a clear primary action button. Steps must be completed in order; future steps shall be visible but not actionable until the current step is done.

**FR-323** The navigate to pickup and navigate to drop-off steps shall provide a deep link that opens Google Maps (or the device's default maps app) with the destination pre-filled.

**FR-324** When the mover taps confirm arrival at pickup, the job status shall update to in_progress.

**FR-325** When the job is in in_progress status, the mover's browser shall begin emitting GPS coordinates every 5 seconds via Supabase Realtime broadcast to the job's channel. These coordinates shall simultaneously be inserted as rows into the location_events table.

**FR-326** The system shall request a WakeLock from the browser when the job enters in_progress to prevent the screen from locking and interrupting GPS emission.

**FR-327** On the complete job step, the mover shall be required to: upload a photo of the delivered items using the device camera, and capture a drawn e-signature from the requester.

**FR-328** The completion photo shall be uploaded directly to the completion-photos Supabase Storage bucket from the mover's browser.

**FR-329** The e-signature shall be drawn on a canvas element in the browser, exported as a PNG image, and uploaded to the completion-photos bucket.

**FR-330** After both assets are uploaded, the mover shall tap a final confirm button which calls the complete-job Edge Function with the storage paths of both files.

**FR-331** On successful completion, the job status shall be set to completed, GPS emission shall stop, the WakeLock shall be released, and the mover shall be returned to their dashboard.

---

### 3.4 Admin Features

#### 3.4.1 Admin Dashboard

**FR-401** The admin dashboard shall show summary statistics: total jobs today, total open jobs, total active movers currently online, total GMV this month, and total pending mover applications.

**FR-402** The admin dashboard shall be optimised for desktop browser use. It shall also be functional on tablet screens.

#### 3.4.2 Mover Approval

**FR-403** The admin shall have access to a mover approval queue showing all mover accounts with status pending, sorted by application date ascending.

**FR-404** Each application in the queue shall show the mover's name, phone, email, vehicle type, service radius, and links to view each uploaded document via a signed URL.

**FR-405** The admin shall be able to approve a mover, which sets `mover_profiles.status` to active and sends an approval email to the mover.

**FR-406** The admin shall be able to reject a mover with a required rejection reason, which sets status to suspended and sends a rejection email containing the reason.

**FR-407** An approved mover shall be able to log in and access the full mover experience from the next login attempt.

#### 3.4.3 Job Management

**FR-408** The admin shall have access to a searchable, filterable table of all jobs in the system.

**FR-409** The table shall display: job ID, requester name, mover name (if assigned), status, scheduled date, pickup city, drop-off city, quoted price. Each row shall be clickable to view full job detail.

**FR-410** The admin shall be able to filter jobs by status, date range, and search by requester name or mover name.

**FR-411** The full job detail view for admin shall include all requester and mover information, the full item list, the GPS trail of the move plotted on a map, any completion photos and e-signature, and a full status history with timestamps.

**FR-412** The admin shall be able to manually cancel any job at any status. A reason shall be required.

#### 3.4.4 User Management

**FR-413** The admin shall have a user management screen showing all users searchable by name, email, or phone.

**FR-414** The admin shall be able to view any user's profile including role, join date, number of jobs, and rating if a mover.

**FR-415** The admin shall be able to suspend any user account. Suspending a user shall immediately invalidate their active sessions.

**FR-416** The admin shall be able to reinstate a suspended user.

#### 3.4.5 Revenue Dashboard

**FR-417** The admin shall have access to a revenue dashboard showing: total GMV for a selected date range, total platform fees earned, total mover payouts, number of completed jobs, and average job value.

**FR-418** The date range shall be selectable with presets for today, this week, this month, and a custom range.

**FR-419** The revenue data shall be displayed in both summary figures and a simple chart by day or week.

---

### 3.5 Pricing Engine

**FR-501** Price calculation shall be performed server-side in the calculate-price Edge Function. No pricing logic shall run in the browser.

**FR-502** The system shall call the Google Maps Distance Matrix API within the Edge Function to determine the road distance in kilometres between the pickup and drop-off coordinates.

**FR-503** The quoted price shall be calculated as follows: base price equals distance in km multiplied by the rate per km; item cost equals the sum of each item's size rate multiplied by its quantity; subtotal equals base price plus item cost; time multiplier equals 1.2 if the scheduled time window falls in peak hours or on a weekend, otherwise 1.0; quoted price equals subtotal multiplied by the time multiplier.

**FR-504** Peak hours shall be defined as morning slots on weekends, and evening slots on any day. The specific definition shall be configurable in the pricing_config table.

**FR-505** Platform fee shall equal the quoted price multiplied by the commission rate stored in pricing_config.

**FR-506** Mover payout shall equal the quoted price minus the platform fee.

**FR-507** All pricing rates — rate per km, item rates by size, peak multiplier, commission rate — shall be stored in the pricing_config database table and shall be editable by admin without a code change or redeployment.

---

### 3.6 Notifications

**FR-601** The system shall request Web Push notification permission from the user after their first meaningful action (requester: after confirming first booking; mover: after going online for the first time).

**FR-602** The system shall store the push subscription object (endpoint, p256dh key, auth key) in the push_subscriptions table associated with the user's account.

**FR-603** A user may have multiple push subscriptions if they use the app on multiple devices or browsers. All shall receive notifications.

**FR-604** The send-push Edge Function shall be responsible for sending all push notifications. It shall be called internally by other Edge Functions, not directly by the client.

**FR-605** The following events shall trigger push notifications:

| Event | Recipient |
|-------|----------|
| Mover claims requester's job | Requester |
| Mover sets status to in_progress | Requester |
| Job completed | Requester |
| New mover application received | Admin (email only, not push) |
| Mover application approved | Mover (email) |
| Mover application rejected | Mover (email) |

**FR-606** Push notifications shall include a title, body text, and a URL that opens the relevant job or screen when tapped.

---

### 3.7 PWA Requirements

**FR-701** The application shall include a valid Web App Manifest with name, short name, start URL, display mode (standalone), theme colour, background colour, and icon assets at 192×192 and 512×512 pixels including a maskable icon variant.

**FR-702** The application shall register a service worker via vite-plugin-pwa that precaches the app shell (HTML, JS, CSS bundles).

**FR-703** The app shell shall load and display a skeleton or offline message within 2 seconds on a repeat visit regardless of network status.

**FR-704** Supabase API responses shall be cached using a network-first strategy with a 5-second timeout falling back to cached data.

**FR-705** Supabase Storage file responses (photos) shall be cached using a cache-first strategy with a 7-day expiry and a maximum of 100 cached entries.

**FR-706** Google Maps tile requests shall be cached using a stale-while-revalidate strategy.

**FR-707** When a mover is in_progress and loses connectivity, GPS location events shall be queued in IndexedDB and flushed to the database when connectivity is restored using the Background Sync API where supported.

**FR-708** On browsers that do not support Background Sync (iOS Safari), the system shall implement a polling retry loop that attempts to flush the queue every 30 seconds.

**FR-709** The app shall display a persistent offline banner when the device has no network connectivity.

**FR-710** A custom install prompt shall be shown to users who have not yet installed the PWA, triggered after their first completed action (not on first page load).

---

## 4. External Interface Requirements

### 4.1 User Interfaces

**UI-01** All requester and mover screens shall be designed mobile-first, optimised for 375px viewport width and above. Touch targets shall be a minimum of 44×44 pixels.

**UI-02** The admin dashboard shall be designed for desktop-first use, optimised for 1280px viewport width, and functional at 768px and above.

**UI-03** All screens shall support both light and dark mode, adapting to the device's system preference.

**UI-04** Font sizes shall not fall below 14px for body text and 12px for secondary labels.

**UI-05** Loading states shall be indicated with skeleton screens or a spinner for all data-fetching operations that may take more than 300ms.

**UI-06** All form inputs shall display inline validation errors beneath the relevant field in real time, not only on form submission.

**UI-07** Destructive actions (cancel job, suspend user) shall require a confirmation dialog before execution.

### 4.2 Hardware Interfaces

**HW-01** The mover app shall access the device GPS via `navigator.geolocation.watchPosition()` with `enableHighAccuracy: true`.

**HW-02** Photo upload shall use `<input type="file" accept="image/*" capture="environment">` to access the device camera on mobile, falling back to file selection on desktop.

**HW-03** The e-signature component shall accept touch and mouse input on a canvas element.

### 4.3 Software Interfaces

**SI-01 — Supabase Auth:** Used for user registration, email verification, login, token management, and session refresh. Accessed via the Supabase JS client.

**SI-02 — Supabase Database:** PostgreSQL accessed via the Supabase JS client using the anon key for client-side queries (constrained by RLS) and the service role key within Edge Functions for privileged operations.

**SI-03 — Supabase Realtime:** Used for postgres_changes subscriptions (job inserts and status updates) and broadcast channels (GPS coordinates). Accessed via the Supabase JS client channel API.

**SI-04 — Supabase Storage:** Used for direct browser uploads of item photos, completion photos, e-signatures, and mover documents. Files do not pass through Edge Functions. Signed URLs are generated server-side for private bucket access.

**SI-05 — Supabase Edge Functions:** HTTP endpoints deployed on Deno. Called from the browser for calculate-price and claim-job. Called server-to-server internally for send-push, send-email, and complete-job.

**SI-06 — Google Maps JavaScript API:** Loaded in the browser. Used for the Places Autocomplete input on the job creation form and the live map display on the tracking page.

**SI-07 — Google Maps Distance Matrix API:** Called exclusively from within the calculate-price Edge Function. Never exposed to the browser.

**SI-08 — Resend:** Called from the send-email Edge Function via REST API to deliver transactional emails.

**SI-09 — Web Push API:** Push notifications sent from the send-push Edge Function using the web-push Deno library with VAPID authentication. Subscriptions stored in the database.

### 4.4 Communication Interfaces

**CI-01** All communication between the browser and Supabase shall use HTTPS. No unencrypted HTTP connections are permitted.

**CI-02** Supabase Realtime uses a WebSocket connection over WSS (WebSocket Secure).

**CI-03** All Edge Function calls from the browser shall include the Authorization header with the user's access token.

**CI-04** Edge Function calls to external APIs (Google Maps, Resend) shall be made server-side only.

---

## 5. Non-Functional Requirements

### 5.1 Performance

**NFR-101** The app shell (initial HTML, CSS, JS) shall load and become interactive within 3 seconds on a 4G mobile connection on a first visit.

**NFR-102** On repeat visits with a primed service worker cache, the app shell shall load within 1 second regardless of network conditions.

**NFR-103** The calculate-price Edge Function shall return a response within 2 seconds under normal conditions.

**NFR-104** A new job posted by a requester shall appear in the mover's request center within 500 milliseconds via Supabase Realtime.

**NFR-105** GPS location updates on the requester's tracking map shall reflect the mover's actual position within 1 second of emission.

**NFR-106** The request center job list shall support pagination or infinite scroll and shall not degrade in performance beyond 500 concurrent open jobs.

**NFR-107** Database queries for the request center listing shall return results within 300ms for up to 1000 open jobs using appropriate indexes.

### 5.2 Reliability and Availability

**NFR-201** The system shall target 99.5% uptime, consistent with Supabase Pro plan SLA.

**NFR-202** The system shall degrade gracefully under Supabase Realtime disruption. If the WebSocket connection drops, the app shall display a reconnecting indicator and automatically attempt reconnection using exponential backoff.

**NFR-203** The job claiming operation shall be idempotent. Submitting the same claim request twice shall not result in a double-claim or an error visible to the user.

**NFR-204** GPS events queued offline shall not be lost. They shall be persisted in IndexedDB and flushed on reconnection.

### 5.3 Scalability

**NFR-301** The system architecture shall support scaling to 10,000 registered users and 500 daily jobs without architectural changes. Supabase handles database and realtime scaling horizontally.

**NFR-302** Edge Functions are stateless and scale automatically with request volume.

**NFR-303** Database indexes shall be created on all foreign key columns and all columns used in WHERE clauses in common queries at the time of initial migration.

### 5.4 Security

**NFR-401** Row Level Security shall be enabled on every table in the public schema. No table shall have a permissive SELECT * policy that exposes all rows to all users.

**NFR-402** The Supabase service role key shall never be exposed to the browser. It shall only be used within Edge Functions.

**NFR-403** The Google Maps server-side API key shall only be used within Edge Functions. A separate browser-restricted API key shall be used in the frontend, restricted to the Places and Maps JavaScript APIs and the production domain.

**NFR-404** All file uploads to Supabase Storage shall be validated for file type and maximum size server-side via storage policies. Accepted types are JPEG and PNG for photos and PDF for documents. Maximum file size is 10MB.

**NFR-405** VAPID private keys for Web Push shall be stored as environment variables in Supabase Edge Function secrets and never committed to source control.

**NFR-406** The job claiming Edge Function shall validate that the requesting user has the mover role before processing the claim.

**NFR-407** The complete-job Edge Function shall validate that the requesting user is the assigned mover of the specified job before processing completion.

### 5.5 Usability

**NFR-501** A new requester with no prior experience of the app shall be able to create and confirm a move booking within 5 minutes.

**NFR-502** A new mover shall be able to locate, claim, and navigate to a job pickup within 3 minutes of the job appearing in the request center.

**NFR-503** All error states shall display a human-readable message explaining what went wrong and what the user should do next. Generic error codes shall not be shown to end users.

**NFR-504** The application shall be navigable without a mouse. All interactive elements shall be reachable via keyboard and shall have visible focus indicators.

### 5.6 Maintainability

**NFR-601** All database schema changes shall be managed as versioned SQL migration files in the `supabase/migrations/` directory. No schema changes shall be made manually via the Supabase dashboard in production.

**NFR-602** All environment-specific values (API keys, URLs) shall be stored in environment variables. No secrets shall be hardcoded in source files.

**NFR-603** Edge Functions shall each have a single responsibility. No Edge Function shall perform more than one primary business operation.

**NFR-604** Pricing configuration shall be stored in the database and editable by admin. No pricing values shall be hardcoded in Edge Functions or frontend code.

---

## 6. System Constraints

**SC-01** The system must be built on Supabase. No alternative backend infrastructure may be introduced without a revision to this specification.

**SC-02** There is no native iOS or Android application in scope. All functionality must be delivered via PWA.

**SC-03** The frontend must be a single-page React application deployed to Vercel.

**SC-04** The system must not store any payment card data. Payment processing is to be integrated in a future version. For the current version, the payment step is a placeholder.

**SC-05** Mover background checks are conducted manually by admin in this version. No third-party background screening API is integrated.

**SC-06** All text in the application shall be in English only in this version. Internationalisation is not in scope.

---

## 7. Data Model Summary

### 7.1 Tables

| Table | Primary Key | Description |
|-------|------------|-------------|
| profiles | uuid (ref auth.users) | All user accounts — requester, mover, admin |
| mover_profiles | uuid | Mover-specific data, vehicle, status, rating |
| jobs | uuid | Core job record, lifecycle owner |
| job_items | uuid | Individual items within a job |
| location_events | uuid | Append-only GPS trail during active moves |
| reviews | uuid | Post-completion ratings and comments |
| push_subscriptions | uuid | Web Push subscription objects per user per device |
| pricing_config | uuid | Single-row admin-editable pricing rates |

### 7.2 Job Status Enum

```
draft → open → claimed → in_progress → completed
                                ↓
                           cancelled
```

### 7.3 Key Relationships

- One profile → zero or one mover_profile (movers only)
- One profile → many jobs (as requester)
- One mover_profile → many jobs (as mover)
- One job → many job_items
- One job → many location_events
- One job → zero or one review
- One profile → many push_subscriptions

### 7.4 Row Level Security Summary

| Table | Requester access | Mover access | Admin access |
|-------|-----------------|--------------|--------------|
| profiles | Own row | Own row | All rows |
| mover_profiles | None | Own row | All rows |
| jobs | Own jobs | Open jobs + own claimed | All rows |
| job_items | Own job's items | Claimed job's items | All rows |
| location_events | Own job's events | Own job's events | All rows |
| reviews | Own reviews | Own reviews received | All rows |
| push_subscriptions | Own subscriptions | Own subscriptions | All rows |
| pricing_config | Read only | Read only | Read + write |

---

## 8. Security Requirements

### 8.1 Authentication Security

**SEC-101** All passwords shall be hashed using bcrypt by Supabase Auth. Plaintext passwords shall never be stored or logged.

**SEC-102** Email verification shall be required before any authenticated action can be performed.

**SEC-103** The system shall not reveal whether an email address is registered when a login attempt fails. The error message shall always be "Invalid email or password."

**SEC-104** Access tokens shall have a maximum lifetime of 1 hour. Refresh tokens shall have a maximum lifetime of 7 days.

### 8.2 Data Access Security

**SEC-201** RLS policies shall enforce that users can only access data they are explicitly authorised to view or modify, as described in section 7.4.

**SEC-202** Sensitive write operations (claim job, complete job, approve mover) shall be performed in Edge Functions using the service role key. These operations shall re-validate the user's identity and role from their JWT before executing.

**SEC-203** Mover document files in the mover-documents storage bucket shall only be accessible via time-limited signed URLs (maximum 1 hour expiry) generated by an admin-authenticated Edge Function.

### 8.3 Transport Security

**SEC-301** All HTTP traffic shall be served over TLS 1.2 or higher. HTTP shall redirect to HTTPS.

**SEC-302** WebSocket connections (Supabase Realtime) shall use WSS only.

### 8.4 Input Validation

**SEC-401** All input submitted to Edge Functions shall be validated for type, format, and range before processing.

**SEC-402** The calculate-price Edge Function shall validate that coordinates are within valid latitude and longitude ranges before calling the Google Maps API.

**SEC-403** File uploads shall be validated for MIME type and file size. Files with unexpected MIME types shall be rejected before storage.

---

## 9. Out of Scope (Version 1.0)

The following features are explicitly excluded from this version of the specification. They may be considered for future versions.

| Feature | Reason deferred |
|---------|----------------|
| Native iOS and Android apps | PWA covers MVP needs |
| In-app messaging / chat | Phone contact sufficient for MVP |
| Payment processing | TBD by team, placeholder in v1 |
| Mover bidding on jobs | First-claim model sufficient for MVP |
| Automated background checks | Manual admin review for MVP |
| Multi-stop jobs | Single pickup/drop-off only |
| Recurring move scheduling | Not required for MVP |
| Damage claims / insurance | Excluded from scope |
| Referral and promo codes | Post-launch marketing feature |
| Internationalisation | English only for MVP |
| In-app earnings wallet | Payout method TBD |
| Customer support chat | External support tool to be decided |
| Driver rating by admin | Admin can suspend, not rate |
| Third-party analytics | To be added post-launch |

---

## 10. Appendix — Environment Variables Reference

### Frontend (Vite build environment)

| Variable | Description |
|----------|------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon (public) key |
| VITE_GOOGLE_MAPS_KEY | Browser-restricted Maps API key |
| VITE_VAPID_PUBLIC_KEY | VAPID public key for Web Push |

### Supabase Edge Functions (set in Supabase dashboard secrets)

| Variable | Description |
|----------|------------|
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Service role key (bypasses RLS) |
| SUPABASE_ANON_KEY | Anon key for user JWT verification |
| GOOGLE_MAPS_KEY | Server-side Maps API key (Distance Matrix enabled) |
| VAPID_PUBLIC_KEY | VAPID public key |
| VAPID_PRIVATE_KEY | VAPID private key |
| RESEND_API_KEY | Resend transactional email API key |

---

*End of SRS — MoveThisOut v1.0*