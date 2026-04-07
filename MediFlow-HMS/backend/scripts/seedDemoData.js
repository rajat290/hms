import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import connectDB from '../config/mongodb.js';
import initializeDatabaseIntegrity from '../config/databaseIntegrity.js';
import appointmentModel from '../models/appointmentModel.js';
import auditLogModel from '../models/auditLogModel.js';
import authSessionModel from '../models/authSessionModel.js';
import doctorModel from '../models/doctorModel.js';
import feedbackModel from '../models/feedbackModel.js';
import invoiceModel from '../models/invoiceModel.js';
import notificationModel from '../models/notificationModel.js';
import paymentLogModel from '../models/paymentLogModel.js';
import prescriptionModel from '../models/prescriptionModel.js';
import reviewModel from '../models/reviewModel.js';
import settingsModel from '../models/settingsModel.js';
import staffModel from '../models/staffModel.js';
import userModel from '../models/userModel.js';
import { ensureInvoiceForAppointment } from '../utils/appointmentIntegrity.js';

const DEMO_SEED_TAG = 'demo-seed-v1';
const DEMO_EMAIL_DOMAIN = 'demo.mediflow.app';

const PASSWORDS = {
  patient: 'Patient@123',
  doctor: 'Doctor@123',
  staff: 'Staff@123',
};

const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@prescripto.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
};

const avatarDataUri = (label, background, foreground = '#f8fafc') => {
  const initials = label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" rx="48" fill="${background}" />
      <text
        x="50%"
        y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif"
        font-size="92"
        font-weight="700"
        fill="${foreground}"
      >${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const startOfDay = (date = new Date()) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const addDays = (days, fromDate = new Date()) => {
  const nextDate = startOfDay(fromDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const addHours = (hours, fromDate = new Date()) => {
  const nextDate = new Date(fromDate);
  nextDate.setHours(nextDate.getHours() + hours);
  return nextDate;
};

const toSlotDate = (date) => `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

const sanitizeSnapshot = (document) => {
  const snapshot = document.toObject({ depopulate: true });
  delete snapshot.password;
  delete snapshot.verificationToken;
  delete snapshot.resetToken;
  delete snapshot.resetTokenExpiry;
  delete snapshot.twoFactorCode;
  delete snapshot.twoFactorCodeExpiry;
  delete snapshot.slots_booked;
  return snapshot;
};

const hashPassword = (plainTextPassword) => bcrypt.hash(plainTextPassword, 10);

const buildBookedSlotMap = (appointments) => {
  const slotMap = new Map();

  appointments
    .filter((appointment) => !appointment.cancelled)
    .forEach((appointment) => {
      const doctorId = appointment.docId.toString();
      const doctorSlots = slotMap.get(doctorId) || {};
      const daySlots = new Set(doctorSlots[appointment.slotDate] || []);
      daySlots.add(appointment.slotTime);
      doctorSlots[appointment.slotDate] = Array.from(daySlots).sort();
      slotMap.set(doctorId, doctorSlots);
    });

  return slotMap;
};

const seedEmails = {
  patients: [
    `patient.aarav@${DEMO_EMAIL_DOMAIN}`,
    `patient.naina@${DEMO_EMAIL_DOMAIN}`,
    `patient.vihaan@${DEMO_EMAIL_DOMAIN}`,
  ],
  doctors: [
    `doctor.meera@${DEMO_EMAIL_DOMAIN}`,
    `doctor.arjun@${DEMO_EMAIL_DOMAIN}`,
    `doctor.riya@${DEMO_EMAIL_DOMAIN}`,
  ],
  staff: [
    `staff.kavya@${DEMO_EMAIL_DOMAIN}`,
    `staff.rahul@${DEMO_EMAIL_DOMAIN}`,
  ],
};

const collectDeletionQuery = (...clauses) => {
  const normalized = clauses.filter(Boolean);
  return normalized.length > 0 ? { $or: normalized } : null;
};

const deleteExistingDemoData = async () => {
  const [existingUsers, existingDoctors, existingStaff] = await Promise.all([
    userModel.find({ email: { $in: seedEmails.patients } }).select('_id'),
    doctorModel.find({ email: { $in: seedEmails.doctors } }).select('_id'),
    staffModel.find({ email: { $in: seedEmails.staff } }).select('_id'),
  ]);

  const userIds = existingUsers.map((item) => item._id);
  const doctorIds = existingDoctors.map((item) => item._id);
  const staffIds = existingStaff.map((item) => item._id);
  const subjectIds = [...userIds, ...doctorIds, ...staffIds].map((id) => id.toString());

  const appointmentQuery = collectDeletionQuery(
    userIds.length ? { userId: { $in: userIds } } : null,
    doctorIds.length ? { docId: { $in: doctorIds } } : null
  );

  const appointmentIds = appointmentQuery
    ? await appointmentModel.find(appointmentQuery).distinct('_id')
    : [];

  const deleteOperations = [];

  if (subjectIds.length) {
    deleteOperations.push(authSessionModel.deleteMany({ subjectId: { $in: subjectIds } }));
  }

  deleteOperations.push(auditLogModel.deleteMany({ 'metadata.seedTag': DEMO_SEED_TAG }));

  const notificationQuery = collectDeletionQuery(
    userIds.length ? { userId: { $in: userIds } } : null,
    staffIds.length ? { staffId: { $in: staffIds } } : null,
    { title: /^Demo Seed \|/ }
  );
  if (notificationQuery) {
    deleteOperations.push(notificationModel.deleteMany(notificationQuery));
  }

  if (appointmentIds.length) {
    deleteOperations.push(reviewModel.deleteMany({ appointmentId: { $in: appointmentIds } }));
    deleteOperations.push(feedbackModel.deleteMany({ appointmentId: { $in: appointmentIds } }));
    deleteOperations.push(prescriptionModel.deleteMany({ appointmentId: { $in: appointmentIds } }));
    deleteOperations.push(invoiceModel.deleteMany({ appointmentId: { $in: appointmentIds } }));
    deleteOperations.push(paymentLogModel.deleteMany({ appointmentId: { $in: appointmentIds } }));
    deleteOperations.push(appointmentModel.deleteMany({ _id: { $in: appointmentIds } }));
  }

  if (userIds.length) {
    deleteOperations.push(paymentLogModel.deleteMany({ patientId: { $in: userIds } }));
    deleteOperations.push(userModel.deleteMany({ _id: { $in: userIds } }));
  }

  if (doctorIds.length) {
    deleteOperations.push(doctorModel.deleteMany({ _id: { $in: doctorIds } }));
  }

  if (staffIds.length) {
    deleteOperations.push(staffModel.deleteMany({ _id: { $in: staffIds } }));
  }

  if (deleteOperations.length > 0) {
    await Promise.all(deleteOperations);
  }
};

const createPatients = async () => {
  const passwordHash = await hashPassword(PASSWORDS.patient);
  const definitions = [
    {
      name: 'Aarav Sharma',
      email: `patient.aarav@${DEMO_EMAIL_DOMAIN}`,
      password: passwordHash,
      phone: '9876500001',
      gender: 'Male',
      dob: '1994-08-14',
      image: avatarDataUri('Aarav Sharma', '#0f766e'),
      address: {
        line1: '221 Lake View Residency',
        line2: 'Salt Lake Sector V',
        city: 'Kolkata',
        state: 'West Bengal',
        zipCode: '700091',
        country: 'India',
      },
      bloodGroup: 'B+',
      knownAllergies: 'Dust, Penicillin',
      currentMedications: 'Vitamin D supplements',
      emergencyContact: {
        name: 'Ritika Sharma',
        phone: '9876500101',
        relation: 'Spouse',
      },
      patientCategory: 'Frequent Visitor',
      chronicConditions: 'Mild hypertension',
      medicalHistory: [
        {
          condition: 'Hypertension',
          diagnosedDate: '2022-03-10',
          notes: 'Managed with diet and regular follow-ups.',
        },
      ],
      familyMembers: [
        {
          name: 'Ritika Sharma',
          relation: 'Spouse',
          phone: '9876500101',
        },
      ],
      medicalRecordNumber: 'MRN-DEMO-001',
      aadharNumber: '111122223333',
      aadharImage: avatarDataUri('Aadhaar Aarav', '#115e59'),
      insuranceProvider: 'Star Health',
      insuranceId: 'STAR-DEMO-001',
      subscriptionPlan: 'premium',
      subscriptionExpiry: addDays(90),
      createdVia: 'self',
      isVerified: true,
    },
    {
      name: 'Naina Verma',
      email: `patient.naina@${DEMO_EMAIL_DOMAIN}`,
      password: passwordHash,
      phone: '9876500002',
      gender: 'Female',
      dob: '1998-02-03',
      image: avatarDataUri('Naina Verma', '#b45309'),
      address: {
        line1: '18 Sunrise Apartments',
        line2: 'Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        zipCode: '500034',
        country: 'India',
      },
      bloodGroup: 'O+',
      knownAllergies: 'None',
      currentMedications: '',
      emergencyContact: {
        name: 'Sunita Verma',
        phone: '9876500102',
        relation: 'Mother',
      },
      patientCategory: 'Standard',
      chronicConditions: '',
      medicalHistory: [],
      familyMembers: [
        {
          name: 'Sunita Verma',
          relation: 'Mother',
          phone: '9876500102',
        },
      ],
      medicalRecordNumber: 'MRN-DEMO-002',
      aadharNumber: '111122223334',
      aadharImage: avatarDataUri('Aadhaar Naina', '#92400e'),
      insuranceProvider: 'HDFC Ergo',
      insuranceId: 'HDFC-DEMO-002',
      subscriptionPlan: 'basic',
      subscriptionExpiry: addDays(30),
      createdVia: 'self',
      isVerified: true,
    },
    {
      name: 'Vihaan Iyer',
      email: `patient.vihaan@${DEMO_EMAIL_DOMAIN}`,
      password: passwordHash,
      phone: '9876500003',
      gender: 'Male',
      dob: '1987-11-19',
      image: avatarDataUri('Vihaan Iyer', '#4338ca'),
      address: {
        line1: '504 Greenfield Towers',
        line2: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560038',
        country: 'India',
      },
      bloodGroup: 'A-',
      knownAllergies: 'Shellfish',
      currentMedications: 'Metformin 500mg',
      emergencyContact: {
        name: 'Ananya Iyer',
        phone: '9876500103',
        relation: 'Sister',
      },
      patientCategory: 'High-risk',
      chronicConditions: 'Type 2 diabetes',
      medicalHistory: [
        {
          condition: 'Type 2 diabetes',
          diagnosedDate: '2020-06-08',
          notes: 'Needs regular glucose monitoring.',
        },
      ],
      familyMembers: [
        {
          name: 'Ananya Iyer',
          relation: 'Sister',
          phone: '9876500103',
        },
      ],
      medicalRecordNumber: 'MRN-DEMO-003',
      aadharNumber: '111122223335',
      aadharImage: avatarDataUri('Aadhaar Vihaan', '#3730a3'),
      insuranceProvider: 'ICICI Lombard',
      insuranceId: 'ICICI-DEMO-003',
      subscriptionPlan: 'premium',
      subscriptionExpiry: addDays(120),
      createdVia: 'admin',
      createdByEmail: ADMIN_CREDENTIALS.email,
      isVerified: true,
    },
  ];

  return userModel.insertMany(definitions, { ordered: true });
};

const createDoctors = async () => {
  const passwordHash = await hashPassword(PASSWORDS.doctor);
  const commonAvailability = {
    enabled: true,
    timezone: 'Asia/Kolkata',
    schedule: {
      monday: [{ start: '09:00', end: '17:00' }],
      tuesday: [{ start: '09:00', end: '17:00' }],
      wednesday: [{ start: '09:00', end: '17:00' }],
      thursday: [{ start: '09:00', end: '17:00' }],
      friday: [{ start: '09:00', end: '17:00' }],
      saturday: [{ start: '10:00', end: '13:00' }],
      sunday: [],
    },
    slotDuration: 30,
    customDates: {},
    blockedDates: [],
  };

  const definitions = [
    {
      name: 'Dr. Meera Kapoor',
      email: `doctor.meera@${DEMO_EMAIL_DOMAIN}`,
      password: passwordHash,
      image: avatarDataUri('Meera Kapoor', '#7c3aed'),
      speciality: 'Cardiology',
      degree: 'MD, DM Cardiology',
      experience: '11 Years',
      about: 'Focuses on preventive cardiology, post-operative follow-ups, and lifestyle-led cardiac recovery.',
      fees: 1200,
      address: {
        line1: 'Heart Care Wing',
        line2: '2nd Floor, South Block',
      },
      available: true,
      isVerified: true,
      slots_booked: {},
      date: Date.now(),
      availability: commonAvailability,
      paymentMethods: { cash: true, online: true },
    },
    {
      name: 'Dr. Arjun Sen',
      email: `doctor.arjun@${DEMO_EMAIL_DOMAIN}`,
      password: passwordHash,
      image: avatarDataUri('Arjun Sen', '#0f766e'),
      speciality: 'Dermatology',
      degree: 'MD Dermatology',
      experience: '8 Years',
      about: 'Handles skin, hair, and allergy consultations with a strong focus on long-term treatment adherence.',
      fees: 900,
      address: {
        line1: 'Skin and Wellness Clinic',
        line2: 'Ground Floor, East Wing',
      },
      available: true,
      isVerified: true,
      slots_booked: {},
      date: Date.now(),
      availability: {
        ...commonAvailability,
        schedule: {
          monday: [{ start: '10:00', end: '18:00' }],
          tuesday: [{ start: '10:00', end: '18:00' }],
          wednesday: [{ start: '10:00', end: '18:00' }],
          thursday: [{ start: '10:00', end: '18:00' }],
          friday: [{ start: '10:00', end: '18:00' }],
          saturday: [{ start: '10:00', end: '14:00' }],
          sunday: [],
        },
      },
      paymentMethods: { cash: true, online: false },
    },
    {
      name: 'Dr. Riya Nair',
      email: `doctor.riya@${DEMO_EMAIL_DOMAIN}`,
      password: passwordHash,
      image: avatarDataUri('Riya Nair', '#be123c'),
      speciality: 'Pediatrics',
      degree: 'MD Pediatrics',
      experience: '9 Years',
      about: 'Works with child wellness visits, follow-up care, growth monitoring, and vaccination planning.',
      fees: 1500,
      address: {
        line1: 'Children Care Unit',
        line2: '1st Floor, North Wing',
      },
      available: true,
      isVerified: true,
      slots_booked: {},
      date: Date.now(),
      availability: {
        ...commonAvailability,
        schedule: {
          monday: [{ start: '09:00', end: '15:00' }],
          tuesday: [{ start: '09:00', end: '15:00' }],
          wednesday: [{ start: '09:00', end: '15:00' }],
          thursday: [{ start: '09:00', end: '15:00' }],
          friday: [{ start: '09:00', end: '15:00' }],
          saturday: [{ start: '09:00', end: '12:00' }],
          sunday: [],
        },
      },
      paymentMethods: { cash: false, online: true },
    },
  ];

  return doctorModel.insertMany(definitions, { ordered: true });
};

const createStaff = async () => {
  const passwordHash = await hashPassword(PASSWORDS.staff);
  const definitions = [
    {
      name: 'Kavya Frontdesk',
      email: `staff.kavya@${DEMO_EMAIL_DOMAIN}`,
      password: passwordHash,
      image: avatarDataUri('Kavya Frontdesk', '#1d4ed8'),
      role: 'Front Desk',
      dob: '1996-04-12',
      phone: '9876501001',
      date: Date.now(),
      isVerified: true,
    },
    {
      name: 'Rahul Billing',
      email: `staff.rahul@${DEMO_EMAIL_DOMAIN}`,
      password: passwordHash,
      image: avatarDataUri('Rahul Billing', '#7c2d12'),
      role: 'Billing Executive',
      dob: '1992-09-28',
      phone: '9876501002',
      date: Date.now(),
      isVerified: true,
    },
  ];

  return staffModel.insertMany(definitions, { ordered: true });
};

const createAppointments = async ({ patients, doctors }) => {
  const patientByEmail = new Map(patients.map((patient) => [patient.email, patient]));
  const doctorByEmail = new Map(doctors.map((doctor) => [doctor.email, doctor]));

  const definitions = [
    {
      key: 'completedPaidConsultation',
      patientEmail: `patient.aarav@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.meera@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(-5)),
      slotTime: '09:30',
      paymentMethod: 'Online',
      paymentStatus: 'paid',
      partialAmount: 1200,
      payment: true,
      isAccepted: true,
      isCompleted: true,
      isCheckedIn: true,
      notes: ['ECG reviewed and medication plan shared.'],
      billingItems: [
        { name: 'Cardiology consultation', cost: 900 },
        { name: 'ECG screening', cost: 300 },
      ],
      invoiceDate: addDays(-5),
    },
    {
      key: 'upcomingAcceptedPaid',
      patientEmail: `patient.aarav@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.meera@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(2)),
      slotTime: '10:00',
      paymentMethod: 'Online',
      paymentStatus: 'paid',
      partialAmount: 1200,
      payment: true,
      isAccepted: true,
      isCompleted: false,
      isCheckedIn: false,
      notes: ['Follow-up appointment scheduled after medication change.'],
      billingItems: [
        { name: 'Follow-up consultation', cost: 1200 },
      ],
      reminderSent24h: true,
      reminderSent24hAt: addHours(-2),
      invoiceDate: new Date(),
    },
    {
      key: 'futureUnpaidCash',
      patientEmail: `patient.naina@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.arjun@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(4)),
      slotTime: '11:00',
      paymentMethod: 'Cash',
      paymentStatus: 'unpaid',
      partialAmount: 0,
      payment: false,
      isAccepted: false,
      isCompleted: false,
      isCheckedIn: false,
      notes: [],
      billingItems: [
        { name: 'Dermatology consultation', cost: 900 },
      ],
    },
    {
      key: 'completedPartialOverdue',
      patientEmail: `patient.vihaan@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.riya@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(-2)),
      slotTime: '14:00',
      paymentMethod: 'Card',
      paymentStatus: 'partially paid',
      partialAmount: 700,
      payment: false,
      isAccepted: true,
      isCompleted: true,
      isCheckedIn: true,
      notes: ['Vaccination follow-up recommended in two weeks.'],
      billingItems: [
        { name: 'Pediatric consultation', cost: 1200 },
        { name: 'Vaccination counselling', cost: 300 },
      ],
      invoiceDate: addDays(-2),
      dueDateOverride: addDays(-1),
    },
    {
      key: 'completedRefunded',
      patientEmail: `patient.aarav@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.riya@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(-10)),
      slotTime: '15:00',
      paymentMethod: 'Online',
      paymentStatus: 'refunded',
      partialAmount: 0,
      payment: false,
      isAccepted: true,
      isCompleted: true,
      isCheckedIn: true,
      notes: ['Visit refunded after duplicate payment capture during testing.'],
      billingItems: [
        { name: 'Child specialist consultation', cost: 1500 },
      ],
      invoiceDate: addDays(-9),
    },
    {
      key: 'futureCancelled',
      patientEmail: `patient.naina@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.meera@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(6)),
      slotTime: '13:30',
      paymentMethod: 'Cash',
      paymentStatus: 'unpaid',
      partialAmount: 0,
      payment: false,
      isAccepted: false,
      isCompleted: false,
      isCheckedIn: false,
      cancelled: true,
      notes: ['Cancelled by patient before doctor confirmation.'],
      billingItems: [
        { name: 'Consultation reservation', cost: 1200 },
      ],
    },
    {
      key: 'todayCheckedIn',
      patientEmail: `patient.vihaan@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.arjun@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(0)),
      slotTime: '16:00',
      paymentMethod: 'Cash',
      paymentStatus: 'paid',
      partialAmount: 900,
      payment: true,
      isAccepted: true,
      isCompleted: false,
      isCheckedIn: true,
      notes: ['Patient already checked in at front desk.'],
      billingItems: [
        { name: 'Skin consultation', cost: 900 },
      ],
      invoiceDate: new Date(),
    },
    {
      key: 'rescheduleCandidate',
      patientEmail: `patient.aarav@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.riya@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(7)),
      slotTime: '12:00',
      paymentMethod: 'Online',
      paymentStatus: 'unpaid',
      partialAmount: 0,
      payment: false,
      isAccepted: false,
      isCompleted: false,
      isCheckedIn: false,
      notes: ['Use this one to test rescheduling from the patient portal.'],
      billingItems: [
        { name: 'Pediatric follow-up', cost: 1500 },
      ],
    },
    {
      key: 'futurePartialPaid',
      patientEmail: `patient.naina@${DEMO_EMAIL_DOMAIN}`,
      doctorEmail: `doctor.meera@${DEMO_EMAIL_DOMAIN}`,
      slotDate: toSlotDate(addDays(5)),
      slotTime: '16:00',
      paymentMethod: 'UPI',
      paymentStatus: 'partially paid',
      partialAmount: 400,
      payment: false,
      isAccepted: true,
      isCompleted: false,
      isCheckedIn: false,
      notes: ['Advance deposit captured for a priority consultation.'],
      billingItems: [
        { name: 'Cardiology consultation', cost: 1200 },
      ],
      invoiceDate: new Date(),
    },
  ];

  const appointmentPayload = definitions.map((definition) => {
    const patient = patientByEmail.get(definition.patientEmail);
    const doctor = doctorByEmail.get(definition.doctorEmail);
    const appointmentDate = definition.invoiceDate || new Date();

    return {
      key: definition.key,
      patient,
      doctor,
      payload: {
        userId: patient._id,
        docId: doctor._id,
        userData: sanitizeSnapshot(patient),
        docData: sanitizeSnapshot(doctor),
        amount: doctor.fees,
        slotTime: definition.slotTime,
        slotDate: definition.slotDate,
        date: appointmentDate.getTime(),
        cancelled: Boolean(definition.cancelled),
        payment: definition.payment,
        isAccepted: definition.isAccepted,
        isCompleted: definition.isCompleted,
        isCheckedIn: definition.isCheckedIn,
        notes: definition.notes,
        paymentStatus: definition.paymentStatus,
        partialAmount: definition.partialAmount,
        paymentMethod: definition.paymentMethod,
        billingItems: definition.billingItems,
        invoiceDate: definition.invoiceDate,
        reminderSent24h: Boolean(definition.reminderSent24h),
        reminderSent2h: Boolean(definition.reminderSent2h),
        reminderSent24hAt: definition.reminderSent24hAt,
        reminderSent2hAt: definition.reminderSent2hAt,
      },
      dueDateOverride: definition.dueDateOverride,
    };
  });

  const createdAppointments = [];

  for (const definition of appointmentPayload) {
    const appointment = await appointmentModel.create(definition.payload);
    createdAppointments.push({
      key: definition.key,
      patient: definition.patient,
      doctor: definition.doctor,
      appointment,
      dueDateOverride: definition.dueDateOverride,
    });
  }

  const bookedSlotMap = buildBookedSlotMap(createdAppointments.map((item) => item.appointment));
  await Promise.all(
    doctors.map((doctor) =>
      doctorModel.updateOne(
        { _id: doctor._id },
        { $set: { slots_booked: bookedSlotMap.get(doctor._id.toString()) || {} } }
      )
    )
  );

  for (const item of createdAppointments) {
    await ensureInvoiceForAppointment(item.appointment);

    if (item.dueDateOverride) {
      await invoiceModel.updateOne(
        { appointmentId: item.appointment._id },
        { $set: { dueDate: item.dueDateOverride } }
      );

      const refreshedAppointment = await appointmentModel.findById(item.appointment._id);
      await ensureInvoiceForAppointment(refreshedAppointment);
    }
  }

  return createdAppointments;
};

const createPaymentLogs = async ({ appointments, patientByEmail }) => {
  const appointmentByKey = new Map(appointments.map((item) => [item.key, item.appointment]));

  const paymentLogs = [
    {
      appointmentId: appointmentByKey.get('completedPaidConsultation')._id,
      patientId: patientByEmail.get(`patient.aarav@${DEMO_EMAIL_DOMAIN}`)._id,
      amount: 1200,
      type: 'payment',
      method: 'online',
      status: 'completed',
      transactionId: 'DEMO-TXN-PAID-001',
      notes: 'Full online payment for completed cardiology consultation.',
      processedBy: ADMIN_CREDENTIALS.email,
      timestamp: addDays(-5),
    },
    {
      appointmentId: appointmentByKey.get('upcomingAcceptedPaid')._id,
      patientId: patientByEmail.get(`patient.aarav@${DEMO_EMAIL_DOMAIN}`)._id,
      amount: 1200,
      type: 'payment',
      method: 'online',
      status: 'completed',
      transactionId: 'DEMO-TXN-PAID-002',
      notes: 'Advance online payment for upcoming follow-up.',
      processedBy: ADMIN_CREDENTIALS.email,
      timestamp: addHours(-6),
    },
    {
      appointmentId: appointmentByKey.get('completedPartialOverdue')._id,
      patientId: patientByEmail.get(`patient.vihaan@${DEMO_EMAIL_DOMAIN}`)._id,
      amount: 700,
      type: 'partial_payment',
      method: 'card',
      status: 'completed',
      transactionId: 'DEMO-TXN-PARTIAL-001',
      notes: 'Card payment collected with balance still pending.',
      processedBy: ADMIN_CREDENTIALS.email,
      timestamp: addDays(-2),
    },
    {
      appointmentId: appointmentByKey.get('completedRefunded')._id,
      patientId: patientByEmail.get(`patient.aarav@${DEMO_EMAIL_DOMAIN}`)._id,
      amount: 1500,
      type: 'payment',
      method: 'online',
      status: 'completed',
      transactionId: 'DEMO-TXN-PAID-003',
      notes: 'Initial online payment later refunded.',
      processedBy: ADMIN_CREDENTIALS.email,
      timestamp: addDays(-10),
    },
    {
      appointmentId: appointmentByKey.get('completedRefunded')._id,
      patientId: patientByEmail.get(`patient.aarav@${DEMO_EMAIL_DOMAIN}`)._id,
      amount: 1500,
      type: 'refund',
      method: 'online',
      status: 'completed',
      transactionId: 'DEMO-TXN-REFUND-001',
      notes: 'Refund processed for duplicate payment test case.',
      processedBy: ADMIN_CREDENTIALS.email,
      timestamp: addDays(-9),
    },
    {
      appointmentId: appointmentByKey.get('todayCheckedIn')._id,
      patientId: patientByEmail.get(`patient.vihaan@${DEMO_EMAIL_DOMAIN}`)._id,
      amount: 900,
      type: 'payment',
      method: 'cash',
      status: 'completed',
      transactionId: 'DEMO-TXN-CASH-001',
      notes: 'Cash collected at the front desk on check-in.',
      processedBy: `staff.kavya@${DEMO_EMAIL_DOMAIN}`,
      timestamp: addHours(-1),
    },
    {
      appointmentId: appointmentByKey.get('futurePartialPaid')._id,
      patientId: patientByEmail.get(`patient.naina@${DEMO_EMAIL_DOMAIN}`)._id,
      amount: 400,
      type: 'partial_payment',
      method: 'online',
      status: 'completed',
      transactionId: 'DEMO-TXN-PARTIAL-002',
      notes: 'UPI advance captured for an upcoming appointment.',
      processedBy: ADMIN_CREDENTIALS.email,
      timestamp: addHours(-3),
    },
  ];

  return paymentLogModel.insertMany(paymentLogs, { ordered: true });
};

const createPrescriptionsAndReviews = async ({ appointments, patientByEmail, doctorByEmail }) => {
  const appointmentByKey = new Map(appointments.map((item) => [item.key, item.appointment]));

  await prescriptionModel.insertMany([
    {
      userId: patientByEmail.get(`patient.aarav@${DEMO_EMAIL_DOMAIN}`)._id,
      docId: doctorByEmail.get(`doctor.meera@${DEMO_EMAIL_DOMAIN}`)._id,
      appointmentId: appointmentByKey.get('completedPaidConsultation')._id,
      medicines: [
        {
          name: 'Atorvastatin',
          dosage: '10mg once daily',
          duration: '30 days',
          instruction: 'Take after dinner.',
        },
        {
          name: 'Aspirin',
          dosage: '75mg once daily',
          duration: '14 days',
          instruction: 'Take after breakfast.',
        },
      ],
      instructions: 'Maintain a low-sodium diet and repeat lipid profile in 4 weeks.',
      date: addDays(-5).getTime(),
    },
    {
      userId: patientByEmail.get(`patient.vihaan@${DEMO_EMAIL_DOMAIN}`)._id,
      docId: doctorByEmail.get(`doctor.riya@${DEMO_EMAIL_DOMAIN}`)._id,
      appointmentId: appointmentByKey.get('completedPartialOverdue')._id,
      medicines: [
        {
          name: 'Cetirizine',
          dosage: '5ml twice daily',
          duration: '5 days',
          instruction: 'Give after meals.',
        },
      ],
      instructions: 'Return if fever persists beyond 48 hours.',
      date: addDays(-2).getTime(),
    },
  ], { ordered: true });

  await reviewModel.insertMany([
    {
      userId: patientByEmail.get(`patient.aarav@${DEMO_EMAIL_DOMAIN}`)._id,
      docId: doctorByEmail.get(`doctor.meera@${DEMO_EMAIL_DOMAIN}`)._id,
      appointmentId: appointmentByKey.get('completedPaidConsultation')._id,
      rating: 5,
      comment: 'Clear explanation, fast follow-up, and a smooth billing experience.',
      date: addDays(-4).getTime(),
    },
  ], { ordered: true });

  await feedbackModel.insertMany([
    {
      userId: patientByEmail.get(`patient.vihaan@${DEMO_EMAIL_DOMAIN}`)._id,
      doctorId: doctorByEmail.get(`doctor.riya@${DEMO_EMAIL_DOMAIN}`)._id,
      appointmentId: appointmentByKey.get('completedPartialOverdue')._id,
      rating: 4,
      comment: 'Helpful care plan, but left an overdue bill intentionally for testing.',
      date: addDays(-1).getTime(),
    },
  ], { ordered: true });
};

const createNotifications = async ({ patients, staffMembers, appointments }) => {
  const patientByEmail = new Map(patients.map((patient) => [patient.email, patient]));
  const staffByEmail = new Map(staffMembers.map((member) => [member.email, member]));
  const appointmentByKey = new Map(appointments.map((item) => [item.key, item.appointment]));

  return notificationModel.insertMany([
    {
      userId: patientByEmail.get(`patient.aarav@${DEMO_EMAIL_DOMAIN}`)._id,
      title: 'Demo Seed | Upcoming follow-up confirmed',
      message: `Your paid follow-up appointment is booked for ${appointmentByKey.get('upcomingAcceptedPaid').slotDate} at ${appointmentByKey.get('upcomingAcceptedPaid').slotTime}.`,
      type: 'appointment',
      read: false,
      date: Date.now(),
    },
    {
      userId: patientByEmail.get(`patient.naina@${DEMO_EMAIL_DOMAIN}`)._id,
      title: 'Demo Seed | Advance payment received',
      message: 'A partial advance has been recorded for your cardiology visit. The remaining amount is still due.',
      type: 'payment',
      read: false,
      date: Date.now(),
    },
    {
      userId: patientByEmail.get(`patient.vihaan@${DEMO_EMAIL_DOMAIN}`)._id,
      title: 'Demo Seed | Prescription ready',
      message: 'Your latest prescription is available in the patient portal for download and follow-up review.',
      type: 'system',
      read: true,
      date: addHours(-5).getTime(),
    },
    {
      staffId: staffByEmail.get(`staff.kavya@${DEMO_EMAIL_DOMAIN}`)._id,
      recipientType: 'staff',
      title: 'Demo Seed | Walk-in patient checked in',
      message: 'One patient is already marked as checked in for today so the front-desk queue can be verified.',
      type: 'appointment',
      read: false,
      date: Date.now(),
    },
    {
      recipientType: 'all',
      title: 'Demo Seed | System notice',
      message: 'This notification exists so shared notification layouts can be tested without creating live traffic.',
      type: 'system',
      read: false,
      date: Date.now(),
    },
  ], { ordered: true });
};

const createAuditLogs = async ({ patients, doctors, appointments }) => {
  const patientByEmail = new Map(patients.map((patient) => [patient.email, patient]));
  const doctorByEmail = new Map(doctors.map((doctor) => [doctor.email, doctor]));
  const appointmentByKey = new Map(appointments.map((item) => [item.key, item.appointment]));

  return auditLogModel.insertMany([
    {
      actorEmail: ADMIN_CREDENTIALS.email,
      actorRole: 'admin',
      action: 'SEED_DEMO_DOCTORS',
      targetType: 'doctor',
      targetId: doctorByEmail.get(`doctor.meera@${DEMO_EMAIL_DOMAIN}`)._id.toString(),
      metadata: {
        seedTag: DEMO_SEED_TAG,
        doctorCount: 3,
      },
    },
    {
      actorEmail: `staff.kavya@${DEMO_EMAIL_DOMAIN}`,
      actorRole: 'staff',
      action: 'CHECK_IN_PATIENT',
      targetType: 'appointment',
      targetId: appointmentByKey.get('todayCheckedIn')._id.toString(),
      metadata: {
        seedTag: DEMO_SEED_TAG,
        patientId: patientByEmail.get(`patient.vihaan@${DEMO_EMAIL_DOMAIN}`)._id.toString(),
      },
    },
    {
      actorEmail: ADMIN_CREDENTIALS.email,
      actorRole: 'admin',
      action: 'PROCESS_REFUND',
      targetType: 'appointment',
      targetId: appointmentByKey.get('completedRefunded')._id.toString(),
      metadata: {
        seedTag: DEMO_SEED_TAG,
        reason: 'Duplicate payment test flow',
      },
    },
  ], { ordered: true });
};

const ensureSettingsDocument = async () => {
  const existingSettings = await settingsModel.findOne({});

  if (existingSettings) {
    return existingSettings;
  }

  return settingsModel.create({
    cancellationWindow: 24,
    currency: process.env.CURRENCY || 'INR',
  });
};

const printSummary = ({ patients, doctors, staffMembers, appointments }) => {
  const credentials = {
    admin: ADMIN_CREDENTIALS,
    patients: patients.map((patient) => ({
      name: patient.name,
      email: patient.email,
      password: PASSWORDS.patient,
    })),
    doctors: doctors.map((doctor) => ({
      name: doctor.name,
      email: doctor.email,
      password: PASSWORDS.doctor,
    })),
    staff: staffMembers.map((member) => ({
      name: member.name,
      email: member.email,
      password: PASSWORDS.staff,
    })),
  };

  const appointmentMap = appointments.reduce((accumulator, item) => {
    accumulator[item.key] = {
      id: item.appointment._id.toString(),
      patient: item.patient.name,
      doctor: item.doctor.name,
      slotDate: item.appointment.slotDate,
      slotTime: item.appointment.slotTime,
      status: {
        cancelled: item.appointment.cancelled,
        paymentStatus: item.appointment.paymentStatus,
        accepted: item.appointment.isAccepted,
        completed: item.appointment.isCompleted,
        checkedIn: item.appointment.isCheckedIn,
      },
    };
    return accumulator;
  }, {});

  console.log('\nDemo seed completed successfully.\n');
  console.log(JSON.stringify({
    credentials,
    appointmentMap,
    notes: [
      'All demo emails are seeded for local testing only.',
      'Admin login is environment-based and was read from backend/.env.',
      'Rerunning this script refreshes only the demo accounts and linked records.',
    ],
  }, null, 2));
};

const run = async () => {
  try {
    await connectDB();
    await initializeDatabaseIntegrity();

    await deleteExistingDemoData();
    await ensureSettingsDocument();

    const [patients, doctors, staffMembers] = await Promise.all([
      createPatients(),
      createDoctors(),
      createStaff(),
    ]);

    const appointments = await createAppointments({ patients, doctors });
    const patientByEmail = new Map(patients.map((patient) => [patient.email, patient]));
    const doctorByEmail = new Map(doctors.map((doctor) => [doctor.email, doctor]));

    await createPaymentLogs({ appointments, patientByEmail });
    await createPrescriptionsAndReviews({ appointments, patientByEmail, doctorByEmail });
    await createNotifications({ patients, staffMembers, appointments });
    await createAuditLogs({ patients, doctors, appointments });

    printSummary({ patients, doctors, staffMembers, appointments });
  } catch (error) {
    console.error('\nDemo seed failed.\n');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

await run();
