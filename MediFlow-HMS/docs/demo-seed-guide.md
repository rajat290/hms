# Demo Seed Guide

Run the demo seed from [backend/package.json](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/package.json) with:

```bash
cd backend
npm run seed:demo
```

This script refreshes only the demo accounts and the records linked to them. It does not wipe the full database.

## Login Credentials

### Admin

- Email: `admin@prescripto.com`
- Password: `admin123`

Admin login is environment-based, so these values come from [backend/.env](/C:/Users/vikas/OneDrive/Desktop/hms/MediFlow-HMS/backend/.env).

### Patients

- `patient.aarav@demo.mediflow.app` / `Patient@123`
- `patient.naina@demo.mediflow.app` / `Patient@123`
- `patient.vihaan@demo.mediflow.app` / `Patient@123`

### Doctors

- `doctor.meera@demo.mediflow.app` / `Doctor@123`
- `doctor.arjun@demo.mediflow.app` / `Doctor@123`
- `doctor.riya@demo.mediflow.app` / `Doctor@123`

### Staff

- `staff.kavya@demo.mediflow.app` / `Staff@123`
- `staff.rahul@demo.mediflow.app` / `Staff@123`

## What Gets Seeded

- 3 patients with profile, insurance, emergency contact, and medical record data
- 3 verified doctors with availability, fees, and payment-method variations
- 2 verified staff accounts
- 9 appointments covering paid, unpaid, partially paid, refunded, cancelled, completed, accepted, checked-in, and reschedulable cases
- invoices for every seeded appointment
- payment logs for cash, card, online payment, partial payment, and refund flows
- prescriptions, reviews, feedback, notifications, and audit logs
- a settings document if one does not already exist

## Recommended Functional Checks

- Patient login, profile, appointment list, billing, notifications, and reschedule flow
- Doctor login, dashboard, appointments, notes, prescription, and reviews
- Staff login, daily appointments, patient list, check-in, and payment updates
- Admin login, doctors, patients, invoices, refunds, analytics, and audit logs

## Notes

- The seeded demo emails are for local testing only. Forgot-password or verification emails sent to these addresses will not reach a real inbox.
- The script prints the current appointment IDs and seeded record summary in the terminal after each run. That is the quickest way to grab live IDs for debugging or direct-link testing.
