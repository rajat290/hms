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
- Current branch for this phase: `phase-1-security-hardening`
- Recommended future branches:
  - `phase-1-security-hardening`
  - `phase-2-data-integrity`
  - `phase-3-auth-hardening`
  - `phase-4-api-quality`
  - `phase-5-architecture-refactor`
  - `phase-6-testing-expansion`
  - `phase-7-devops-docs`

## Master Phase Tracker
- Phase 0: Stabilization - completed
- Phase 1: Security Fixes - completed
- Phase 2: Data Integrity Fixes - pending
- Phase 3: Authentication Hardening - pending
- Phase 4: API Quality - pending
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

## Next Recommended Phase
Phase 2: Data Integrity Fixes

Planned focus:
- add MongoDB transactions around booking and payment flows
- add transaction-safe cancellation and refund handling
- make reminder processing more strictly idempotent
- add slot uniqueness protection at the database layer
- strengthen model-level data validation
