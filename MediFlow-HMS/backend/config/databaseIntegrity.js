import appointmentModel from '../models/appointmentModel.js';
import authSessionModel from '../models/authSessionModel.js';
import auditLogModel from '../models/auditLogModel.js';
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

const numberTypes = ['double', 'int', 'long', 'decimal'];

const stringField = () => ({ bsonType: 'string' });
const numberField = () => ({ bsonType: numberTypes });
const booleanField = () => ({ bsonType: 'bool' });
const dateField = () => ({ bsonType: 'date' });
const objectIdField = () => ({ bsonType: 'objectId' });
const objectField = (properties = {}, required = []) => ({
  bsonType: 'object',
  ...(Object.keys(properties).length > 0 ? { properties } : {}),
  ...(required.length > 0 ? { required } : {}),
});
const arrayField = (items) => ({ bsonType: 'array', items });
const enumStringField = (values) => ({ bsonType: 'string', enum: values });

const validatorEntries = [
  {
    model: appointmentModel,
    validator: objectField({
      userId: objectIdField(),
      docId: objectIdField(),
      userData: objectField(),
      docData: objectField(),
      amount: numberField(),
      slotTime: stringField(),
      slotDate: stringField(),
      date: numberField(),
      cancelled: booleanField(),
      payment: booleanField(),
      isAccepted: booleanField(),
      isCompleted: booleanField(),
      notes: arrayField(stringField()),
      paymentStatus: enumStringField(['paid', 'partially paid', 'unpaid', 'refunded']),
      partialAmount: numberField(),
      paymentMethod: enumStringField(['Cash', 'Card', 'UPI', 'Online', 'N/A']),
      isCheckedIn: booleanField(),
      billingItems: arrayField(objectField({
        name: stringField(),
        cost: numberField(),
      })),
      invoiceDate: dateField(),
      reminderSent24h: booleanField(),
      reminderSent2h: booleanField(),
      reminderSent24hAt: dateField(),
      reminderSent2hAt: dateField(),
      reminder24hLockUntil: dateField(),
      reminder2hLockUntil: dateField(),
    }, ['userId', 'docId', 'userData', 'docData', 'amount', 'slotTime', 'slotDate', 'date']),
  },
  {
    model: authSessionModel,
    validator: objectField({
      sessionId: stringField(),
      subjectId: stringField(),
      role: enumStringField(['user', 'doctor', 'staff', 'admin']),
      refreshTokenHash: stringField(),
      expiresAt: dateField(),
      revokedAt: dateField(),
      revokedReason: stringField(),
      lastUsedAt: dateField(),
      lastRotatedAt: dateField(),
      userAgent: stringField(),
      ipAddress: stringField(),
      createdAt: dateField(),
      updatedAt: dateField(),
    }, ['sessionId', 'subjectId', 'role', 'refreshTokenHash', 'expiresAt']),
  },
  {
    model: auditLogModel,
    validator: objectField({
      actorEmail: stringField(),
      actorRole: enumStringField(['admin', 'staff']),
      action: stringField(),
      targetType: enumStringField(['user', 'doctor', 'appointment', 'system']),
      targetId: stringField(),
      metadata: objectField(),
    }, ['actorEmail', 'action', 'targetType']),
  },
  {
    model: doctorModel,
    validator: objectField({
      name: stringField(),
      email: stringField(),
      password: stringField(),
      image: stringField(),
      speciality: stringField(),
      degree: stringField(),
      experience: stringField(),
      about: stringField(),
      available: booleanField(),
      fees: numberField(),
      slots_booked: objectField(),
      address: objectField(),
      date: numberField(),
      isVerified: booleanField(),
      verificationToken: stringField(),
      resetToken: stringField(),
      resetTokenExpiry: dateField(),
      twoFactorEnabled: booleanField(),
      availability: objectField(),
      paymentMethods: objectField(),
    }, ['name', 'email', 'password', 'image', 'speciality', 'degree', 'experience', 'about', 'fees', 'address', 'date']),
  },
  {
    model: feedbackModel,
    validator: objectField({
      userId: objectIdField(),
      doctorId: objectIdField(),
      appointmentId: objectIdField(),
      rating: numberField(),
      comment: stringField(),
      date: numberField(),
    }, ['userId', 'doctorId', 'appointmentId', 'rating', 'date']),
  },
  {
    model: invoiceModel,
    validator: objectField({
      invoiceNumber: stringField(),
      patientId: objectIdField(),
      appointmentId: objectIdField(),
      items: arrayField(objectField({
        description: stringField(),
        quantity: numberField(),
        unitPrice: numberField(),
        total: numberField(),
      }, ['description', 'quantity', 'unitPrice', 'total'])),
      totalAmount: numberField(),
      status: enumStringField(['paid', 'unpaid', 'overdue', 'cancelled', 'partially paid', 'refunded']),
      dueDate: dateField(),
      createdAt: dateField(),
      updatedAt: dateField(),
    }, ['invoiceNumber', 'patientId', 'appointmentId', 'items', 'totalAmount', 'dueDate']),
  },
  {
    model: notificationModel,
    validator: objectField({
      userId: objectIdField(),
      staffId: objectIdField(),
      recipientType: enumStringField(['user', 'staff', 'admin', 'all']),
      title: stringField(),
      message: stringField(),
      type: enumStringField(['system', 'appointment', 'payment', 'emergency']),
      read: booleanField(),
      date: numberField(),
    }, ['title', 'message']),
  },
  {
    model: paymentLogModel,
    validator: objectField({
      appointmentId: objectIdField(),
      patientId: objectIdField(),
      amount: numberField(),
      type: enumStringField(['payment', 'refund', 'partial_payment']),
      method: enumStringField(['cash', 'online', 'card']),
      status: enumStringField(['completed', 'pending', 'failed', 'refunded']),
      transactionId: stringField(),
      notes: stringField(),
      processedBy: stringField(),
      timestamp: dateField(),
    }, ['appointmentId', 'patientId', 'amount', 'type']),
  },
  {
    model: prescriptionModel,
    validator: objectField({
      userId: objectIdField(),
      docId: objectIdField(),
      appointmentId: objectIdField(),
      medicines: arrayField(objectField({
        name: stringField(),
        dosage: stringField(),
        duration: stringField(),
        instruction: stringField(),
      }, ['name', 'dosage', 'duration'])),
      instructions: stringField(),
      date: numberField(),
    }, ['userId', 'docId', 'appointmentId', 'medicines', 'date']),
  },
  {
    model: reviewModel,
    validator: objectField({
      userId: objectIdField(),
      docId: objectIdField(),
      appointmentId: objectIdField(),
      rating: numberField(),
      comment: stringField(),
      date: numberField(),
    }, ['userId', 'docId', 'appointmentId', 'rating', 'comment']),
  },
  {
    model: settingsModel,
    validator: objectField({
      cancellationWindow: numberField(),
      currency: stringField(),
    }, ['cancellationWindow']),
  },
  {
    model: staffModel,
    validator: objectField({
      name: stringField(),
      email: stringField(),
      password: stringField(),
      image: stringField(),
      role: stringField(),
      dob: stringField(),
      phone: stringField(),
      date: numberField(),
      resetToken: stringField(),
      resetTokenExpiry: dateField(),
      isVerified: booleanField(),
      verificationToken: stringField(),
    }, ['name', 'email', 'password', 'image', 'date']),
  },
  {
    model: userModel,
    validator: objectField({
      name: stringField(),
      email: stringField(),
      image: stringField(),
      phone: stringField(),
      address: objectField(),
      gender: stringField(),
      dob: stringField(),
      password: stringField(),
      isVerified: booleanField(),
      verificationToken: stringField(),
      resetToken: stringField(),
      resetTokenExpiry: dateField(),
      twoFactorEnabled: booleanField(),
      twoFactorCode: stringField(),
      twoFactorCodeExpiry: dateField(),
      insuranceProvider: stringField(),
      insuranceId: stringField(),
      subscriptionPlan: enumStringField(['basic', 'premium', 'none']),
      subscriptionExpiry: dateField(),
      bloodGroup: stringField(),
      knownAllergies: stringField(),
      currentMedications: stringField(),
      patientCategory: enumStringField(['Standard', 'VIP', 'High-risk', 'Frequent Visitor']),
      chronicConditions: stringField(),
      medicalHistory: arrayField(objectField({
        condition: stringField(),
        diagnosedDate: stringField(),
        notes: stringField(),
      })),
      familyMembers: arrayField(objectField({
        name: stringField(),
        relation: stringField(),
        phone: stringField(),
      })),
      medicalRecordNumber: stringField(),
      aadharNumber: stringField(),
      aadharImage: stringField(),
      emergencyContact: objectField(),
      createdVia: enumStringField(['self', 'admin']),
      createdByEmail: stringField(),
    }, ['name', 'email', 'password']),
  },
];

const applyCollectionValidator = async ({ model, validator }) => {
  const db = model.db.db;
  const collectionName = model.collection.collectionName;
  const validationOptions = {
    validator: { $jsonSchema: validator },
    validationLevel: 'moderate',
    validationAction: 'error',
  };

  const existingCollections = await db.listCollections({ name: collectionName }, { nameOnly: true }).toArray();

  if (existingCollections.length === 0) {
    await db.createCollection(collectionName, validationOptions);
    return;
  }

  await db.command({
    collMod: collectionName,
    ...validationOptions,
  });
};

const initializeDatabaseIntegrity = async () => {
  for (const entry of validatorEntries) {
    await applyCollectionValidator(entry);
    await entry.model.createIndexes();
  }

  console.log('Database validators and indexes synchronized.');
};

export default initializeDatabaseIntegrity;
