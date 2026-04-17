# Password Reset OTP Guide

## Branch

`feature/password-reset-otp`

## Goal

Replace email reset links with a simpler in-app OTP recovery flow for:

- Patient portal
- Doctor panel
- Staff panel

The new flow is:

1. User enters email
2. System emails a 6-digit OTP
3. User pastes the OTP into the UI
4. Backend verifies the OTP and issues a short-lived hidden reset token
5. User sets a new password
6. User is redirected back to login

The flow no longer auto-signs the user in after resetting the password.

## Why This Change Was Made

- It reduces friction for non-technical users
- It removes the need to open reset links from email
- It keeps recovery inside the product flow
- It is easier to explain during demos and interviews
- It is a stronger product UX for a healthcare audience

## Backend Changes

### Shared OTP reset service

Added [passwordResetOtpService.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/services/auth/passwordResetOtpService.js).

It is responsible for:

- generating 6-digit OTP codes
- hashing OTP codes before storing them
- enforcing OTP expiry
- tracking invalid OTP attempts
- issuing a short-lived reset session token after OTP verification
- clearing OTP and reset state when needed

### Model changes

Added OTP reset fields to:

- [userModel.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/models/userModel.js)
- [doctorModel.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/models/doctorModel.js)
- [staffModel.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/models/staffModel.js)

New fields:

- `resetOtpCodeHash`
- `resetOtpExpiry`
- `resetOtpAttempts`

### Database validation

Updated collection validators in [databaseIntegrity.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/config/databaseIntegrity.js) so the new reset fields are recognized by the database integrity layer.

### Email delivery

Added OTP email delivery in [emailService.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/services/emailService.js).

This replaces the reset-link message with an OTP-focused email for password recovery.

### Auth services

Updated:

- [userAuthService.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/services/auth/userAuthService.js)
- [roleAccountService.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/services/auth/roleAccountService.js)

These now support:

- requesting reset OTP
- verifying reset OTP
- resetting password only after OTP verification
- revoking old sessions after password change
- returning success without auto-login

### Repository updates

Updated:

- [userAuthRepository.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/repositories/userAuthRepository.js)
- [roleAuthRepository.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/repositories/roleAuthRepository.js)

These now support lookup by email for OTP verification.

### API changes

Updated controllers:

- [userController.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/controllers/userController.js)
- [doctorController.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/controllers/doctorController.js)
- [staffController.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/controllers/staffController.js)

Updated routes:

- [userRoute.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/routes/userRoute.js)
- [doctorRoute.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/routes/doctorRoute.js)
- [staffRoute.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/routes/staffRoute.js)

New endpoint added per role:

- `POST /verify-reset-otp`

Validation added in [validators.js](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/backend/middleware/validators.js).

## Frontend Changes

### Patient portal

Updated [PasswordReset.jsx](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/frontend/src/components/PasswordReset.jsx).

The patient reset page is now a 3-step flow:

1. enter email
2. verify OTP
3. create and confirm new password

After success, the user is redirected to the login page.

### Doctor and staff login flow

Updated:

- [ForgotPassword.jsx](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/admin/src/pages/ForgotPassword.jsx)
- [Login.jsx](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/admin/src/pages/Login.jsx)

The doctor and staff panels now use the same 3-step OTP reset flow inside the back-office sign-in experience.

Removed:

- [ResetPassword.jsx](C:/Users/vikas/OneDrive/Desktop/hms/hms-password-reset-otp/MediFlow-HMS/admin/src/pages/ResetPassword.jsx)

This file was removed because email-link recovery is no longer the intended flow.

## Security and Product Decisions

- OTP codes are hashed before storage
- OTPs expire automatically
- Repeated invalid attempts are capped
- A short-lived reset token is issued only after OTP verification
- Password reset revokes existing sessions
- The app no longer auto-logs users in after password reset
- Forgot-password responses do not reveal whether an account exists

## Verification

Verified on this branch:

- Backend tests passed: `18/18` suites, `77/77` tests
- Frontend tests passed
- Frontend build passed
- Admin build passed

## Notes

- Admin still does not use this flow because admin auth is currently env-based rather than account-based
- Email verification is still a separate system and has not been changed in this branch
