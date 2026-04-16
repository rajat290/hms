# Production Architecture Foundation

## Purpose

This document explains the production-grade architecture pass done for the HMS project.

The goal of this pass was not just to move files around. It was to make the codebase behave more like a product maintained by senior engineers:

- safer startup behavior
- cleaner shutdown behavior
- less duplicated business logic
- clearer domain boundaries
- shared foundations across apps instead of repeated ad hoc patterns
- better documentation for future maintenance

## Branch

- `feature/production-architecture-foundation`

## What Changed

### 1. Backend runtime is now composed like an application, not a single script

Files:

- [createApp.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/app/createApp.js)
- [createApiRouter.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/app/createApiRouter.js)
- [healthHandler.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/app/healthHandler.js)
- [registerStaticAssets.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/app/registerStaticAssets.js)
- [startServer.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/bootstrap/startServer.js)
- [infrastructure.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/bootstrap/infrastructure.js)
- [gracefulShutdown.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/bootstrap/gracefulShutdown.js)
- [server.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/server.js)
- [cronJobs.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/jobs/cronJobs.js)

What changed:

- split backend bootstrapping into app creation, infrastructure startup, and server lifecycle modules
- added a fail-fast startup path so infrastructure errors stop the server instead of letting it continue in a half-broken state
- added graceful shutdown support for `SIGINT`, `SIGTERM`, `unhandledRejection`, and `uncaughtException`
- made cron startup idempotent and added explicit cron shutdown support
- moved health handling into a reusable app-level module

Why this matters:

- production systems need predictable startup and shutdown behavior
- one huge `server.js` file is hard to test and easy to break
- background jobs should not be started repeatedly or left running during shutdown

### 2. Doctor and staff auth flows now share one service foundation

Files:

- [roleAuthRepository.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/repositories/roleAuthRepository.js)
- [roleAccountService.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/services/auth/roleAccountService.js)
- [doctorController.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/controllers/doctorController.js)
- [staffController.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/controllers/staffController.js)

What changed:

- extracted shared verify-email, login, forgot-password, reset-password, refresh-session, and logout behavior into one role-account service
- added a repository factory so doctor and staff account lookups follow one reusable pattern
- kept role-specific messaging and email copy configurable at the controller layer

Why this matters:

- duplicate auth logic across role controllers creates drift over time
- every auth policy change would otherwise need to be patched in multiple files
- this makes future role-account changes cheaper and safer

### 3. Patient onboarding now uses one shared pipeline

Files:

- [patientOnboardingRepository.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/repositories/patientOnboardingRepository.js)
- [patientOnboardingService.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/services/patients/patientOnboardingService.js)
- [cloudinaryUploadService.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/services/uploads/cloudinaryUploadService.js)
- [adminController.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/controllers/adminController.js)
- [staffController.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/controllers/staffController.js)

What changed:

- admin and staff patient creation now go through one onboarding service
- duplicate uniqueness checks, password generation, file upload handling, JSON parsing, and welcome-email behavior were centralized
- admin and staff still keep their own business-rule differences through options such as required fields and duplicate messages

Why this matters:

- onboarding is a business-critical workflow and should have one trusted pipeline
- copy-pasted onboarding logic leads to inconsistent validation, file handling, and email behavior
- a shared service gives you one place to improve patient creation later

### 4. Both React apps now share runtime-config and session-refresh foundations

Files:

- [clientConfig.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/shared/config/clientConfig.js)
- [registerSessionRefreshInterceptor.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/shared/http/registerSessionRefreshInterceptor.js)
- [frontend/src/context/AppContext.jsx](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/frontend/src/context/AppContext.jsx)
- [admin/src/context/AppContext.jsx](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/admin/src/context/AppContext.jsx)
- [admin/src/context/AdminContext.jsx](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/admin/src/context/AdminContext.jsx)
- [admin/src/context/DoctorContext.jsx](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/admin/src/context/DoctorContext.jsx)
- [admin/src/context/StaffContext.jsx](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/admin/src/context/StaffContext.jsx)
- [admin/src/pages/Login.jsx](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/admin/src/pages/Login.jsx)

What changed:

- added a shared client-config validator/helper for `VITE_BACKEND_URL` and currency defaults
- added a shared session-refresh interceptor utility used by both the patient app and the back-office app
- removed duplicated refresh-interceptor logic from both app contexts
- aligned multiple admin contexts to the same shared backend URL source

Why this matters:

- frontend and admin apps should not drift on basic runtime and auth behavior
- token refresh is critical infrastructure behavior and should not be hand-written differently in multiple places
- shared config reduces silent runtime breakage from bad env values

## General Engineering Practices Followed

These are the main product-grade practices used in this pass.

### Thin entrypoints, composed startup

Practice:

- keep server entry files small
- separate app creation from infrastructure startup
- separate infrastructure startup from process lifecycle handling

Why:

- this improves testability
- this makes failures easier to isolate
- this reduces hidden side effects at import time

### Fail fast, don’t limp

Practice:

- if critical infrastructure fails, stop startup instead of partially booting

Why:

- a half-started healthcare app is more dangerous than a clean startup failure
- operators should know immediately when the app is not healthy

### Graceful shutdown is part of architecture

Practice:

- close the HTTP server cleanly
- stop cron jobs explicitly
- disconnect infrastructure in shutdown flow

Why:

- this prevents background work from continuing after the app is supposed to stop
- this reduces shutdown-time corruption and deployment instability

### Shared business logic belongs in services, not copied controllers

Practice:

- move repeated workflows into services and repositories
- keep controllers focused on HTTP request/response handling

Why:

- business rules change over time
- a single service is cheaper to update and easier to test than multiple copied controller implementations

### One pipeline for one business capability

Practice:

- patient onboarding now has one shared implementation
- role-account auth now has one shared implementation

Why:

- this creates a single source of truth for core workflows
- it reduces inconsistent validation and edge-case handling

### Reusable client foundations

Practice:

- centralize env parsing and session-refresh interception

Why:

- auth/session behavior is infrastructure
- infrastructure should be shared and deterministic, not duplicated

### New seams should get direct tests

Practice:

- every major extracted seam got targeted backend coverage

Files:

- [roleAccountService.test.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/__tests__/roleAccountService.test.js)
- [patientOnboardingService.test.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/__tests__/patientOnboardingService.test.js)
- [createApp.test.js](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/__tests__/createApp.test.js)

Why:

- architecture refactors can look clean while still hiding regressions
- direct tests around the new seams make the refactor durable

### Preserve behavior while improving structure

Practice:

- kept existing route contracts and role behavior intact where possible
- used configurable service options instead of forcing one rigid flow on all roles

Why:

- product-grade refactors should improve internal quality without unnecessarily breaking working features

## Verification

Verified successfully:

- backend tests passed: `74/74`
- frontend tests passed: `2/2`
- frontend build passed
- admin build passed

## Remaining Recommendations

This pass upgrades architecture and maintainability, but a few product-grade steps still remain worth doing later:

- add Docker and `docker-compose` for local/prod parity
- add CI so backend tests and frontend builds run on every PR
- add OpenAPI/Swagger documentation for the public and panel APIs
- continue extracting remaining write-heavy controller domains such as billing analytics and doctor/staff operational flows
- introduce route-level code splitting in both React apps to reduce bundle size warnings

## Bottom Line

The project now has a stronger production foundation because:

- startup and shutdown are predictable
- major duplicated backend workflows are centralized
- client runtime/session behavior is shared across apps
- new architecture seams are documented and tested

This is the kind of refactor that makes a project easier to trust, easier to grow, and easier to hand over to another engineer without them feeling like they are stepping into a student prototype.
