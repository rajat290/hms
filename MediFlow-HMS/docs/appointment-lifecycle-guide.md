# Appointment Lifecycle Guide

## Purpose

This branch replaces the older boolean-heavy appointment behavior with a clearer visit lifecycle that behaves more like a real hospital workflow.

Before this change, the system mainly depended on separate flags like:

- `isAccepted`
- `isCheckedIn`
- `isCompleted`
- `cancelled`

That worked technically, but it made the logic hard to reason about because different panels interpreted those flags differently.

This branch introduces a single canonical field:

- `visitStatus`

The old flags are still kept in sync for backward compatibility, analytics continuity, and safer rollout.

## Core Design

The appointment model now separates two different concerns:

1. Visit lifecycle
2. Payment lifecycle

Visit lifecycle answers:

- Where is this appointment operationally?
- Has the doctor confirmed it?
- Has the patient arrived?
- Is the consultation in progress?
- Is the visit closed?

Payment lifecycle answers:

- Is it unpaid?
- Is it partially paid?
- Is it fully paid?
- Was it refunded?

These are intentionally separate because a visit can be:

- `accepted` but still `unpaid`
- `completed` but `partially paid`
- `cancelled` with `refunded`

## Visit States

The canonical visit states are:

- `requested`
- `accepted`
- `checked_in`
- `in_consultation`
- `completed`
- `cancelled`

## Allowed Transitions

The flow is now intentionally guarded.

- `requested -> accepted`
- `requested -> checked_in`
- `requested -> cancelled`
- `accepted -> checked_in`
- `accepted -> in_consultation`
- `accepted -> cancelled`
- `checked_in -> in_consultation`
- `checked_in -> cancelled`
- `in_consultation -> completed`

No other transitions are allowed.

Important effect:

- A consultation cannot jump straight to `completed` anymore without entering `in_consultation`.
- An appointment already in consultation can no longer be casually cancelled.

## Role Ownership

The system now gives each panel a clearer responsibility.

### Patient

Patient can:

- book an appointment
- cancel while the visit is still early enough
- reschedule only while the visit is still in a pre-arrival state

Patient cannot:

- cancel after check-in
- cancel during consultation
- cancel after completion
- reschedule after check-in, consultation start, completion, or cancellation

### Admin

Admin can:

- confirm a newly requested appointment
- cancel an appointment while it is still operationally cancellable
- view the lifecycle consistently across all appointments

### Staff

Staff can:

- check in a requested or accepted appointment
- cancel only while the visit is still safely cancellable
- continue using billing separately from visit-state logic

### Doctor

Doctor can:

- confirm a requested appointment
- start the consultation from `accepted` or `checked_in`
- complete only after consultation has actually started
- cancel only before the consultation has begun

This gives the doctor flow a more realistic sequence:

- confirm
- consult
- complete

instead of the old pattern where "accept" and "complete" felt too abrupt.

## Booking Rules

Booking now creates appointments with:

- `visitStatus = requested`
- `lastStatusUpdatedAt`

The system still blocks double-booking at the database level with the unique active slot index.

## Cancellation Rules

Cancellation is now driven by visit state instead of just one boolean flag.

### Patient cancellation

Patient cancellation is blocked when the appointment is:

- `checked_in`
- `in_consultation`
- `completed`
- `cancelled`

The cancellation window in hours is still enforced separately from lifecycle state.

### Admin / Staff / Doctor cancellation

All panel-side cancellation paths now go through the same shared integrity helper, which:

- moves the appointment to `cancelled`
- releases the doctor slot
- syncs invoice status if needed

## Rescheduling Rules

Rescheduling is now allowed only for:

- `requested`
- `accepted`

Rescheduling resets the visit flow back to:

- `requested`

It also tracks:

- `rescheduledCount`
- `lastRescheduledAt`

and clears reminder locks so reminder jobs stay accurate after a slot move.

## Data Model Changes

The appointment schema now includes:

- `visitStatus`
- `acceptedAt`
- `checkedInAt`
- `consultationStartedAt`
- `completedAt`
- `cancelledAt`
- `lastStatusUpdatedAt`
- `cancellationReason`
- `rescheduledCount`
- `lastRescheduledAt`

The model also has a validation-time sync layer so legacy flags and the new lifecycle stay aligned during document saves.

## UI Changes

The admin app now uses a shared lifecycle helper:

- `admin/src/utils/appointmentLifecycle.js`

This helper gives every panel the same answers for:

- current visit status
- badge label and badge tone
- whether accept is allowed
- whether check-in is allowed
- whether consultation can start
- whether completion is allowed
- whether cancellation is allowed

That removed the old pattern where each page guessed status from a slightly different mix of booleans.

## Major Files Updated

### Backend

- `backend/utils/appointmentLifecycle.js`
- `backend/models/appointmentModel.js`
- `backend/utils/appointmentIntegrity.js`
- `backend/controllers/userController.js`
- `backend/controllers/adminController.js`
- `backend/controllers/staffController.js`
- `backend/controllers/doctorController.js`
- `backend/routes/doctorRoute.js`
- `backend/config/databaseIntegrity.js`

### Admin App

- `admin/src/utils/appointmentLifecycle.js`
- `admin/src/context/AdminContext.jsx`
- `admin/src/context/DoctorContext.jsx`
- `admin/src/components/backoffice/StatusBadge.jsx`
- `admin/src/pages/Admin/AllAppointments.jsx`
- `admin/src/pages/Admin/Dashboard.jsx`
- `admin/src/pages/Admin/PatientDetails.jsx`
- `admin/src/pages/Doctor/DoctorAppointments.jsx`
- `admin/src/pages/Doctor/DoctorDashboard.jsx`
- `admin/src/pages/Staff/StaffAppointments.jsx`
- `admin/src/pages/Staff/StaffDashboard.jsx`
- `admin/src/pages/Staff/StaffQueue.jsx`
- `admin/src/pages/Staff/StaffFollowUp.jsx`
- `admin/src/pages/Staff/StaffBilling.jsx`

## Why This Feels Better Now

The main improvement is not only visual. It is logical.

Now the panels answer the user's natural questions cleanly:

- Is this booking just requested, or already confirmed?
- Has the patient arrived yet?
- Is the doctor already consulting?
- Can I still cancel this?
- What is the next valid action?

That reduces operator confusion because the software is now reflecting an actual workflow instead of exposing raw implementation flags.

## Verification

The branch was verified with:

- backend tests passing: `74/74`
- admin production build passing

Notes:

- local installs were restored for `backend` and `admin` before verification because the machine had incomplete `node_modules`
- admin build still reports the existing large-bundle warning from Vite, but the build succeeds

## Recommended Next Step

The clean next branch after this one is patient login simplification, especially:

- OTP-based password reset
- optional Google login for patient accounts only

Those changes will pair well with this lifecycle refactor because the patient journey will feel smoother both before and after booking.
