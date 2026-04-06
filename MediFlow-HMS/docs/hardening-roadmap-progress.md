# HMS Hardening Roadmap Progress

## Purpose
This document tracks the hardening and stabilization work for the HMS project phase by phase.

For each phase, it records:
- why the phase was needed
- what files changed
- what behavior changed
- how the phase was verified

## Branch Strategy
- Every phase or major module change should be done on its own branch.
- Current branch for this phase: `Phase4-API-quality-improvement`
- Recommended future branches:
  - `phase-5-architecture-refactor`
  - `phase-6-testing-expansion`
  - `phase-7-devops-docs`

## Master Phase Tracker
- Phase 0: Stabilization - completed
- Phase 1: Security Fixes - completed
- Phase 2: Data Integrity Fixes - completed
- Phase 3: Authentication Hardening - completed
- Phase 4: API Quality - completed
- Phase 5: Code Architecture Refactor - pending
- Phase 6: Testing - pending
- Phase 7: DevOps and Documentation - pending
- Phase 8: Advanced Scaling Features - pending

## Phase 0 - Stabilization

### Why This Phase Was Needed
Before deeper security and architecture work, the codebase had a few runtime and contract issues that would keep breaking normal app behavior:
- payment verification trusted client-side inputs too much
- admin invoice download route existed in the UI but not in the backend router
- refund status did not match the appointment schema
- patient creation email sending used an invalid Nodemailer API
- admin, staff, and doctor cancellations did not release booked slots
- backend and frontend test runners were broken
- health monitoring endpoint was missing

### What Changed

#### 1. Payment verification flow was stabilized
Files:
- `backend/server.js`
- `backend/routes/paymentRoute.js`
- `backend/controllers/userController.js`
- `frontend/src/pages/Verify.jsx`

What changed:
- payment webhooks are now mounted before global JSON parsing so Stripe raw-body verification can work correctly
- Razorpay verification now checks required verification fields and validates the request against the authenticated user
- Stripe verification now uses `session_id` from the success URL instead of trusting only a `success=true` query string
- payment initiation now blocks unauthorized or already-paid requests

Why:
- this closes a correctness gap in the current payment flow and makes the frontend/backend contract safer and more predictable

#### 2. Admin invoice and doctor management contracts were repaired
Files:
- `backend/routes/adminRoute.js`
- `backend/controllers/adminController.js`
- `admin/src/pages/Admin/DoctorsList.jsx`

What changed:
- added the missing `/api/admin/download-invoice/:invoiceId` route
- added a safe `/api/admin/delete-doctor/:doctorId` route
- updated the admin doctor list to call the configured backend URL instead of a broken fallback

Why:
- the admin app was calling endpoints that were not wired correctly, which would cause visible runtime failures

#### 3. Refund and patient-creation runtime bugs were fixed
Files:
- `backend/models/appointmentModel.js`
- `backend/controllers/adminController.js`

What changed:
- `paymentStatus` now allows `refunded`
- admin-created patient onboarding now uses `nodemailer.createTransport`
- welcome-email sending no longer breaks the API response after the patient has already been saved

Why:
- refunds were structurally broken
- patient creation could fail after partial success, which is confusing and unsafe operationally

#### 4. Appointment cancellation now releases slots consistently
Files:
- `backend/controllers/userController.js`
- `backend/controllers/adminController.js`
- `backend/controllers/staffController.js`
- `backend/controllers/doctorController.js`

What changed:
- when an appointment is cancelled by admin, staff, or doctor, the booked doctor slot is released from `slots_booked`

Why:
- previously, only the patient-side cancellation flow released slots, which could leave doctors artificially blocked

#### 5. Operational observability was improved
Files:
- `backend/server.js`

What changed:
- added `GET /api/health`
- health response includes uptime, timestamp, memory usage, and MongoDB connection state

Why:
- this creates a stable entry point for monitoring and later deployment checks

#### 6. Smaller admin/frontend bugs were cleaned up
Files:
- `admin/src/context/AppContext.jsx`
- `admin/src/context/AdminContext.jsx`
- `admin/src/context/StaffContext.jsx`
- `admin/src/pages/Admin/Dashboard.jsx`
- `admin/src/pages/Admin/Settings.jsx`
- `admin/src/pages/Doctor/DoctorAppointments.jsx`
- `admin/src/pages/Staff/StaffAppointments.jsx`
- `frontend/src/components/SmartScheduler.jsx`

What changed:
- fixed off-by-one month formatting in admin date formatting
- improved age calculation accuracy
- removed duplicate `acceptAppointment` key in admin context
- removed dead staff `mark-paid` route usage
- fixed lowercase `onclick` bug in admin dashboard
- cleaned up doctor note submission so it only posts once
- added accessibility labels to `SmartScheduler` form inputs
- aligned cancellation settings UI copy with the backend hour-based validation

Why:
- these were low-level defects that create unnecessary friction while testing real flows

#### 7. Test and build infrastructure was repaired
Files:
- `backend/package.json`
- `backend/jest.config.js`
- `backend/__tests__/models.test.js`
- `backend/__tests__/userController.test.js`
- `backend/__tests__/notificationController.test.js`
- `frontend/vitest.config.js`
- `frontend/src/components/__tests__/SmartScheduler.test.jsx`

What changed:
- backend Jest now runs in the repo's ESM setup
- stale backend tests were replaced with current tests that match the real codebase
- frontend Vitest config was restored
- stale Jest-style frontend tests were replaced with working Vitest tests for the current `SmartScheduler` component

Why:
- a broken test runner makes every future phase riskier and slower

### Verification Results
- Backend tests: passed
- Frontend tests: passed
- Frontend production build: passed
- Admin production build: passed

### Remaining Notes After Phase 0
- frontend and admin bundles are still large and should be optimized later
- auth is still single-token based and needs Phase 3 hardening
- NoSQL sanitization, rate limiting, Helmet, and strict CORS still belong to Phase 1
- transactions, idempotency improvements, and slot uniqueness belong to Phase 2

## Phase 1 - Security Fixes

### Why This Phase Was Needed
After the stabilization pass, the biggest remaining risks were still security-focused:
- request payloads were not sanitized against NoSQL-style operator injection
- authentication and AI endpoints could be brute-forced or abused without request throttling
- CORS was too permissive for a production-style deployment
- request validation existed only inconsistently across route groups
- HTTP security headers were not being applied systematically

### What Changed

#### 1. Server-wide request hardening was added
Files:
- `backend/server.js`
- `backend/config/security.js`
- `backend/middleware/requestSanitizer.js`
- `backend/middleware/rateLimiters.js`

What changed:
- added `helmet` with a configuration that is safe for the current frontend/assets setup
- added `express-mongo-sanitize` globally after JSON parsing
- added a recursive input sanitizer that trims strings and removes null bytes from body, query, and params
- added a global API limiter for `/api/*`
- exempted `/api/health` from the global limiter so monitoring checks do not get throttled

Why:
- this closes easy abuse paths, reduces attack surface from malformed input, and makes the backend safer by default

#### 2. CORS was tightened from wildcard mode to an allowlist model
Files:
- `backend/server.js`
- `backend/config/security.js`

What changed:
- replaced permissive CORS usage with an environment-driven allowlist
- allowed origins can now come from `CORS_ORIGINS`, `FRONTEND_URL`, `ADMIN_URL`, `CLIENT_URL`, and `APP_URL`
- localhost and `127.0.0.1` remain allowed for development

Why:
- this keeps local development workable while preventing the API from being openly callable from arbitrary browser origins

#### 3. Route-level rate limiting was added to high-risk endpoints
Files:
- `backend/middleware/rateLimiters.js`
- `backend/routes/userRoute.js`
- `backend/routes/doctorRoute.js`
- `backend/routes/staffRoute.js`
- `backend/routes/adminRoute.js`
- `backend/routes/aiRoute.js`

What changed:
- added stricter auth limiter to login routes
- added dedicated forgot-password limiter to password-reset initiation and reset endpoints
- added AI-specific limiter to `/api/ai/*` routes
- kept a broader API limiter in place for general request bursts

Why:
- login, reset, and AI endpoints are the most obvious targets for brute force, spam, and cost-amplification abuse

#### 4. Input validation coverage was expanded across the live route surface
Files:
- `backend/middleware/validators.js`
- `backend/routes/userRoute.js`
- `backend/routes/doctorRoute.js`
- `backend/routes/staffRoute.js`
- `backend/routes/adminRoute.js`
- `backend/routes/aiRoute.js`

What changed:
- introduced a reusable validation layer for IDs, enums, strings, numbers, arrays, booleans, and object-like payloads
- added validation middleware to auth flows, booking flows, payment verification, invoice routes, patient creation, AI routes, profile updates, doctor availability routes, and notification actions
- strengthened validators for structured fields like `paymentMethods`, `availability`, and profile objects

Why:
- this creates a consistent backend entry point for rejecting malformed or abusive requests before controller logic runs

#### 5. Security middleware now has direct backend test coverage
Files:
- `backend/__tests__/securityMiddleware.test.js`
- `backend/middleware/requestSanitizer.js`
- `backend/middleware/rateLimiters.js`
- `backend/middleware/validators.js`

What changed:
- added tests for recursive request sanitization
- added tests for validation failure shape
- added tests for valid auth-populated profile payloads
- added tests showing health checks can bypass rate limiting while protected routes still throttle correctly

Why:
- Phase 1 adds cross-cutting security behavior, so direct middleware tests reduce the risk of silent regressions in later phases

### Verification Results
- Backend tests: passed (`11/11`)
- Backend startup and `/api/health`: passed
- Frontend tests: passed
- Frontend production build: passed
- Admin production build: passed

### Remaining Notes After Phase 1
- auth is still single-token based and needs refresh-token/logout hardening in Phase 3
- transactions and slot uniqueness still belong to Phase 2
- centralized error handling and consistent response envelopes still belong to Phase 4
- upload file-type and size restrictions are still worth hardening later

## Phase 2 - Data Integrity Fixes

### Why This Phase Was Needed
After the security pass, the biggest remaining risks were data consistency and concurrency problems:
- booking, payment verification, cancellation, and refund flows still performed multiple writes without atomic protection
- appointment slots could still drift from the appointment collection during races or partial failures
- invoice creation was duplicate-prone and not tightly synchronized with appointment payment state
- reminder flags existed, but reminders could still be double-sent across retries or restarts
- model-level validation was still mostly an application concern instead of also being enforced at the database layer

### What Changed

#### 1. A shared transaction and integrity layer was introduced
Files:
- `backend/utils/transaction.js`
- `backend/utils/appointmentIntegrity.js`

What changed:
- added a shared MongoDB transaction runner
- added reusable helpers for slot reservation/release, payment finalization, refund processing, invoice synchronization, and payment-method normalization
- made invoice creation idempotent and collision-resistant instead of count-based

Why:
- this gives the booking and billing flows one consistent atomic path instead of multiple controllers each re-implementing partial logic

#### 2. Booking, cancellation, rescheduling, and payment verification now run atomically
Files:
- `backend/controllers/userController.js`
- `backend/controllers/adminController.js`
- `backend/controllers/staffController.js`
- `backend/controllers/doctorController.js`
- `backend/routes/paymentRoute.js`

What changed:
- patient booking now creates the appointment, reserves the slot, and writes notifications in a single transaction
- user/admin/staff/doctor cancellation paths now share a transaction-safe slot-release flow
- rescheduling now updates the appointment and both slot mutations together, and resets reminder state for the new slot
- Razorpay and Stripe verification plus webhook completion now finalize payment, payment logs, and invoice state through the same idempotent payment helper
- online payment initiation now charges only the outstanding balance when an appointment is partially paid

Why:
- this closes the exact corruption windows where the system could previously save only part of a business action

#### 3. Invoice and refund integrity was tightened
Files:
- `backend/controllers/adminController.js`
- `backend/models/invoiceModel.js`
- `backend/models/paymentLogModel.js`
- `backend/routes/adminRoute.js`
- `backend/middleware/validators.js`

What changed:
- invoice generation is now idempotent per appointment instead of producing duplicates
- invoices are synchronized from appointment state for paid, unpaid, partially paid, cancelled, refunded, and overdue scenarios
- refunds now run inside transactions and update appointment state, invoice state, and refund logs together
- added the missing `/api/admin/process-refund` route wiring
- payment logs now support transaction-level deduplication through a sparse unique `transactionId` index

Why:
- invoices and payment logs are billing records, so they need deterministic one-to-one linkage with appointments and payment events

#### 4. Reminder idempotency was upgraded from flags-only to lock-and-confirm behavior
Files:
- `backend/controllers/notificationController.js`
- `backend/jobs/cronJobs.js`
- `backend/models/appointmentModel.js`

What changed:
- reminders now claim a short-lived lock before sending
- reminders only mark `sent` after a successful email send, and failed sends release the lock for retry
- reminder timestamps and lock fields were added to the appointment model
- overdue invoice cron logic now promotes stale unpaid or partially paid invoices to `overdue`

Why:
- this makes reminder processing retry-safe and greatly reduces the chance of duplicate reminder emails during retries or overlapping job runs

#### 5. Database-level protections were added
Files:
- `backend/models/appointmentModel.js`
- `backend/models/invoiceModel.js`
- `backend/models/paymentLogModel.js`
- `backend/config/databaseIntegrity.js`
- `backend/server.js`

What changed:
- added a unique active-slot compound index on `{ docId, slotDate, slotTime }` with cancelled appointments excluded
- added invoice uniqueness per appointment
- added collection-level MongoDB `$jsonSchema` validators for all current backend models
- server startup now synchronizes validators and indexes after the MongoDB connection is established

Why:
- application logic should not be the only line of defense against duplicate slots or malformed writes

#### 6. Phase 2 test coverage was expanded
Files:
- `backend/__tests__/appointmentIntegrity.test.js`
- `backend/__tests__/models.test.js`
- `backend/__tests__/notificationController.test.js`

What changed:
- added direct tests for invoice/status/payment helper behavior
- added schema index assertions for appointment, invoice, and payment-log integrity constraints
- updated reminder tests to cover claim-before-send behavior

Why:
- the new integrity layer is cross-cutting, so targeted tests make later refactors much safer

### Verification Results
- Backend tests: passed (`18/18`)
- Backend startup, validator/index sync, and `/api/health`: passed
- Frontend tests: passed
- Frontend production build: passed
- Admin production build: passed

### Remaining Notes After Phase 2
- auth is still single-token based and needs refresh-token/logout hardening in Phase 3
- centralized error handling and response consistency still belong to Phase 4
- pagination and API versioning still belong to Phase 4
- upload file validation, logging infrastructure, and broader production operations work still belong to later phases

## Phase 3 - Authentication Hardening

### Why This Phase Was Needed
After the data-integrity pass, authentication was still the biggest remaining runtime and security weakness:
- all roles still used one long-lived JWT with no refresh flow
- logout only removed browser storage and could not revoke a live token on the server
- password resets did not invalidate previously issued sessions
- admin auth still had no real session lifecycle even though it was protected by environment credentials
- user 2FA reused the email verification token field and had no expiry
- the two React apps had no automatic recovery path when an access token expired

### What Changed

#### 1. A shared server-side session layer was introduced
Files:
- `backend/models/authSessionModel.js`
- `backend/utils/authSessions.js`
- `backend/config/databaseIntegrity.js`
- `backend/models/userModel.js`

What changed:
- added a dedicated auth-session collection with unique session IDs, refresh-token hashing, expiry timestamps, revocation metadata, and TTL cleanup
- added shared helpers for access-token issuance, refresh-token rotation, access-token verification against the live session store, and role-aware session revocation
- added unique token IDs so refresh rotation always produces a new token, even within the same second
- added dedicated `twoFactorCode` and `twoFactorCodeExpiry` fields for users instead of reusing `verificationToken`
- synchronized the new auth-session collection and updated user schema fields into the MongoDB validator setup

Why:
- this creates a real server-controlled session lifecycle instead of treating JWTs as self-contained forever-tokens
- refresh tokens are now revocable, rotatable, and unlinkable from database leaks because only hashes are stored

#### 2. All backend role auth flows now use short-lived access tokens plus refresh tokens
Files:
- `backend/controllers/userController.js`
- `backend/controllers/doctorController.js`
- `backend/controllers/staffController.js`
- `backend/controllers/adminController.js`
- `backend/middleware/createAuthMiddleware.js`
- `backend/middleware/authUser.js`
- `backend/middleware/authDoctor.js`
- `backend/middleware/authStaff.js`
- `backend/middleware/authAdmin.js`
- `backend/routes/userRoute.js`
- `backend/routes/doctorRoute.js`
- `backend/routes/staffRoute.js`
- `backend/routes/adminRoute.js`
- `backend/middleware/validators.js`

What changed:
- login for patient, doctor, staff, and admin now issues both `token` and `refreshToken`
- every role group now has `/refresh-session` and `/logout` endpoints
- auth middleware now validates access tokens against the active session store and rejects revoked or expired sessions
- logout now revokes the active server session instead of only clearing local state
- password reset for patient, doctor, and staff now revokes all prior sessions for that subject before issuing a fresh login session
- admin auth now gets the same session lifecycle as the other roles while still using the configured environment credentials

Why:
- this closes the production gap where a stolen token stayed valid until expiry with no meaningful server-side invalidation path
- password changes now behave like true credential rotations instead of leaving older sessions alive

#### 3. User 2FA is now separated from email verification and has an expiry window
Files:
- `backend/controllers/userController.js`
- `backend/models/userModel.js`
- `backend/config/databaseIntegrity.js`

What changed:
- login-time 2FA codes now use dedicated `twoFactorCode` and `twoFactorCodeExpiry` fields
- 2FA codes expire after 10 minutes
- expired codes are cleared and force the user to re-run login instead of remaining valid indefinitely
- enabling 2FA no longer exposes the code in the API response

Why:
- email verification and login verification are different security events and should not share a storage field
- expiring codes reduce replay risk and make the 2FA flow operationally predictable

#### 4. Both React apps now keep access and refresh tokens in sync and recover from access-token expiry
Files:
- `frontend/src/context/AppContext.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/components/PasswordReset.jsx`
- `frontend/src/components/Navbar.jsx`
- `admin/src/context/AdminContext.jsx`
- `admin/src/context/DoctorContext.jsx`
- `admin/src/context/StaffContext.jsx`
- `admin/src/context/AppContext.jsx`
- `admin/src/pages/Login.jsx`
- `admin/src/pages/ResetPassword.jsx`
- `admin/src/components/Navbar.jsx`

What changed:
- patient, admin, doctor, and staff sessions now store both access and refresh tokens
- both React apps now register Axios response interceptors that automatically refresh the active session on `401` responses and retry the failed request once
- logout now calls the backend revoke endpoint before clearing local storage
- password-reset auto-login now stores both tokens where applicable
- the admin shell now clears other role sessions on login so only one role session remains active at a time

Why:
- short-lived access tokens only work well when the client can renew them transparently
- the admin app is a shared shell for three roles, so stale tokens from another role would otherwise break routing and refresh behavior

#### 5. Phase 3 verification coverage was added
Files:
- `backend/__tests__/authSessions.test.js`
- `backend/__tests__/models.test.js`

What changed:
- added direct tests for token duration parsing, session issuance, refresh-token rotation, access-token verification against the session store, subject-wide revocation, and admin fingerprint invalidation
- extended model tests to cover the new auth-session schema indexes and new user 2FA fields

Why:
- session rotation and revocation are security-critical behavior and need direct regression coverage, not only manual testing

### Verification Results
- Backend tests: passed (`25/25`)
- Backend startup, validator/index sync, and `/api/health`: passed
- Frontend tests: passed (`2/2`)
- Frontend production build: passed
- Admin production build: passed

### Remaining Notes After Phase 3
- logout and refresh revocation are now enforced through MongoDB-backed session records; Redis can still be introduced later for lower-latency revocation or multi-service scale, but it is no longer required for correctness
- admin credentials still come from environment variables, so a fuller admin identity model can still be considered later
- centralized error handling and consistent response envelopes still belong to Phase 4
- pagination and API versioning still belong to Phase 4
- upload file validation, logging infrastructure, and broader production operations work still belong to later phases

## Phase 4 - API Quality

### Why This Phase Was Needed
After the authentication pass, the backend still had three API-quality gaps:
- routes were only mounted under `/api/*`, so there was no versioned alias for safe future breaking changes
- success and error responses were still shaped ad hoc by each controller
- several list endpoints still returned entire collections with no paging controls

### What Changed

#### 1. Centralized API response normalization and error handling were added
Files:
- `backend/utils/apiResponse.js`
- `backend/middleware/responseNormalizer.js`
- `backend/middleware/errorHandler.js`
- `backend/server.js`

What changed:
- added shared helpers for normalized success and error envelopes
- added a response-normalizer middleware that standardizes API JSON into a consistent shape with `success`, `message`, `data`, and `error` or `pagination` where applicable
- kept the legacy top-level fields alongside the new `data` envelope so the current frontend and admin apps remain compatible
- added a centralized API 404 handler and final error handler for unresolved API routes and thrown application errors

Why:
- this makes the API easier to reason about and safer to evolve without forcing a full client rewrite in the same phase

#### 2. Versioned API aliases were introduced
Files:
- `backend/server.js`

What changed:
- mounted the main API route groups under both `/api/*` and `/api/v1/*`
- mounted payment webhooks under both `/api/payment/*` and `/api/v1/payment/*`
- exposed health checks under both `/api/health` and `/api/v1/health`

Why:
- this creates a stable path for future breaking API changes while preserving the existing client contract

#### 3. Shared pagination utilities and query validation were added
Files:
- `backend/utils/pagination.js`
- `backend/middleware/validators.js`
- `backend/routes/adminRoute.js`
- `backend/routes/doctorRoute.js`
- `backend/routes/staffRoute.js`
- `backend/routes/userRoute.js`

What changed:
- added shared parsing and metadata helpers for `page` and `limit`
- added route-level pagination validation for list endpoints
- added doctor-list query validation and optional slot-date query validation for staff daily appointments

Why:
- pagination needs to be consistent at both the route-validation layer and the controller layer to be reliable

#### 4. List-heavy endpoints now return paginated data with metadata
Files:
- `backend/controllers/adminController.js`
- `backend/controllers/doctorController.js`
- `backend/controllers/staffController.js`
- `backend/controllers/userController.js`

What changed:
- paginated admin appointments, doctors, staff, patients, invoices, payment history, and audit logs
- paginated doctor appointments, public doctor list, and doctor reviews
- paginated staff appointments, patients, daily appointments, and notifications
- paginated user appointments, prescriptions, and notifications
- every paginated response now includes metadata such as `page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`, and `hasPreviousPage`

Why:
- this prevents unbounded collection reads and gives the API a consistent contract for list navigation

#### 5. Phase 4 backend coverage was added
Files:
- `backend/__tests__/apiQualityMiddleware.test.js`

What changed:
- added tests for versioned API success responses
- added tests for paginated response metadata
- added tests for centralized 404 handling on versioned API paths

Why:
- these changes are cross-cutting infrastructure behavior, so direct tests help keep future route work safe

### Verification Results
- Backend tests: passed (`28/28`)
- Backend startup, validator/index sync, `/api/health`, and `/api/v1/health`: passed
- Frontend tests: passed (`2/2`)
- Frontend production build: passed
- Admin production build: passed

### Remaining Notes After Phase 4
- the backend now supports pagination, but the current React screens still mostly rely on the legacy top-level arrays and first-page defaults; dedicated UI pagination controls can be added later without changing the API again
- legacy `/api/*` routes remain live alongside `/api/v1/*` for backward compatibility
- some business-rule failures still intentionally return `success: false` without changing their historical HTTP status so existing clients do not break during this phase
- logging infrastructure, service extraction, and broader architecture cleanup still belong to Phase 5 and later phases

## Next Recommended Phase
Phase 5: Code Architecture Refactor

Planned focus:
- extract service-layer logic from large controllers
- isolate database query responsibilities more cleanly
- centralize configuration and startup validation further
- add logging infrastructure that works cleanly with the new API envelope
