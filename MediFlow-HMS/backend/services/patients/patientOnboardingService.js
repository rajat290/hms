import bcrypt from 'bcrypt';
import crypto from 'crypto';
import validator from 'validator';
import { createPatientRecord, findExistingPatientByIdentifiers } from '../../repositories/patientOnboardingRepository.js';
import { logEmailFailure, sendWelcomeCredentialsEmail } from '../emailService.js';
import { uploadImageIfPresent } from '../uploads/cloudinaryUploadService.js';

const parseStructuredValue = (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (error) {
            throw new Error(`Invalid ${fieldName} data`);
        }
    }

    return value;
};

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const validateRequiredFields = ({
    input,
    requiredFields,
    missingFieldsMessage,
}) => {
    const missingField = requiredFields.find((field) => {
        const value = input[field];
        return value === undefined || value === null || value === '';
    });

    if (missingField) {
        throw new Error(missingFieldsMessage);
    }
};

const createPatientOnboarding = async ({
    input,
    files,
    options,
}) => {
    const {
        requiredFields = [],
        missingFieldsMessage = 'All required fields must be provided',
        duplicateMessage = 'Patient already exists',
        sendWelcomeEmail = true,
    } = options;

    validateRequiredFields({
        input,
        requiredFields,
        missingFieldsMessage,
    });

    const {
        name,
        email,
        phone,
        dob,
        gender,
        medicalRecordNumber,
        aadharNumber,
        insuranceProvider,
        insuranceId,
        address,
        emergencyContact,
        patientCategory,
        chronicConditions,
    } = input;

    if (!validator.isEmail(email)) {
        throw new Error('Please enter a valid email');
    }

    const identifierQuery = [{ email }, { phone }];

    if (medicalRecordNumber) {
        identifierQuery.push({ medicalRecordNumber });
    }

    if (aadharNumber) {
        identifierQuery.push({ aadharNumber });
    }

    const existingPatient = await findExistingPatientByIdentifiers(identifierQuery);
    if (existingPatient) {
        throw new Error(duplicateMessage);
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await hashPassword(tempPassword);

    const [profileImageUrl, aadharImageUrl] = await Promise.all([
        uploadImageIfPresent(files?.image?.[0]),
        uploadImageIfPresent(files?.aadharImage?.[0]),
    ]);

    const patientData = {
        name,
        email,
        phone,
        dob,
        gender,
        image: profileImageUrl,
        aadharImage: aadharImageUrl,
        password: hashedPassword,
        date: Date.now(),
    };

    const parsedAddress = parseStructuredValue(address, 'address');
    const parsedEmergencyContact = parseStructuredValue(emergencyContact, 'emergency contact');

    if (medicalRecordNumber) patientData.medicalRecordNumber = medicalRecordNumber;
    if (aadharNumber) patientData.aadharNumber = aadharNumber;
    if (insuranceProvider) patientData.insuranceProvider = insuranceProvider;
    if (insuranceId) patientData.insuranceId = insuranceId;
    if (parsedAddress) patientData.address = parsedAddress;
    if (parsedEmergencyContact) patientData.emergencyContact = parsedEmergencyContact;
    if (patientCategory) patientData.patientCategory = patientCategory;
    if (chronicConditions) patientData.chronicConditions = chronicConditions;

    const patient = await createPatientRecord(patientData);

    if (sendWelcomeEmail) {
        try {
            await sendWelcomeCredentialsEmail({ email, tempPassword });
        } catch (error) {
            logEmailFailure('patient welcome email', error);
        }
    }

    return {
        patient,
        credentials: {
            email,
            password: tempPassword,
        },
    };
};

export { createPatientOnboarding };
