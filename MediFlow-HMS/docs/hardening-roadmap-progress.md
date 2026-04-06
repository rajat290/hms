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
- Current branch for this phase: `codex/phase-0-stabilization`
- Recommended future branches:
  - `codex/phase-1-security-hardening`
  - `codex/phase-2-data-integrity`
  - `codex/phase-3-auth-hardening`
  - `codex/phase-4-api-quality`
  - `codex/phase-5-architecture-refactor`
  - `codex/phase-6-testing-expansion`
  - `codex/phase-7-devops-docs`

## Master Phase Tracker
- Phase 0: Stabilization - completed
- Phase 1: Security Fixes - pending
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

## Next Recommended Phase
Phase 1: Security Fixes

Planned focus:
- add `express-mongo-sanitize`
- add `express-rate-limit`
- add `helmet`
- tighten CORS
- standardize request validation entry points
