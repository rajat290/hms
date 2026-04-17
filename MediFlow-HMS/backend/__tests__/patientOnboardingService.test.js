import { jest } from '@jest/globals';

const createPatientRecordMock = jest.fn();
const findExistingPatientByIdentifiersMock = jest.fn();
const logEmailFailureMock = jest.fn();
const sendWelcomeCredentialsEmailMock = jest.fn();
const uploadImageIfPresentMock = jest.fn();

jest.unstable_mockModule('../repositories/patientOnboardingRepository.js', () => ({
  createPatientRecord: createPatientRecordMock,
  findExistingPatientByIdentifiers: findExistingPatientByIdentifiersMock,
}));

jest.unstable_mockModule('../services/emailService.js', () => ({
  logEmailFailure: logEmailFailureMock,
  sendWelcomeCredentialsEmail: sendWelcomeCredentialsEmailMock,
}));

jest.unstable_mockModule('../services/uploads/cloudinaryUploadService.js', () => ({
  uploadImageIfPresent: uploadImageIfPresentMock,
}));

const { createPatientOnboarding } = await import('../services/patients/patientOnboardingService.js');

describe('patientOnboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadImageIfPresentMock.mockImplementation(async (file) => {
      if (!file?.path) {
        return '';
      }

      if (file.path === 'profile.png') {
        return 'https://cdn.mediflow.test/profile.png';
      }

      if (file.path === 'aadhar.png') {
        return 'https://cdn.mediflow.test/aadhar.png';
      }

      return 'https://cdn.mediflow.test/other.png';
    });
  });

  it('creates patient records through one shared onboarding pipeline', async () => {
    findExistingPatientByIdentifiersMock.mockResolvedValue(null);
    createPatientRecordMock.mockResolvedValue({
      _id: 'patient-1',
      name: 'Aarav Singh',
      email: 'aarav@mediflow.test',
      phone: '9999999999',
      medicalRecordNumber: 'MRN-1001',
      aadharMasked: 'XXXX XXXX 9012',
    });

    const response = await createPatientOnboarding({
      input: {
        name: 'Aarav Singh',
        email: 'aarav@mediflow.test',
        phone: '9999999999',
        dob: '1995-01-10',
        gender: 'Male',
        medicalRecordNumber: 'MRN-1001',
        aadharNumber: '123456789012',
        patientCategory: 'VIP',
        chronicConditions: 'Diabetes',
        address: JSON.stringify({ line1: 'Salt Lake', city: 'Kolkata' }),
        emergencyContact: JSON.stringify({ name: 'Neha', phone: '8888888888' }),
      },
      files: {
        image: [{ path: 'profile.png' }],
        aadharImage: [{ path: 'aadhar.png' }],
      },
      options: {
        requiredFields: ['name', 'email', 'phone', 'dob', 'gender', 'medicalRecordNumber', 'aadharNumber'],
        missingFieldsMessage: 'Missing required fields',
        duplicateMessage: 'Duplicate patient',
      },
    });

    expect(findExistingPatientByIdentifiersMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        { email: 'aarav@mediflow.test' },
        { phone: '9999999999' },
        { medicalRecordNumber: 'MRN-1001' },
        { aadharHash: expect.any(String) },
        { aadharNumber: '123456789012' },
      ]),
    );
    expect(createPatientRecordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Aarav Singh',
        image: 'https://cdn.mediflow.test/profile.png',
        aadharImage: 'https://cdn.mediflow.test/aadhar.png',
        patientCategory: 'VIP',
        chronicConditions: 'Diabetes',
        address: { line1: 'Salt Lake', city: 'Kolkata' },
        emergencyContact: { name: 'Neha', phone: '8888888888' },
        aadharHash: expect.any(String),
        aadharMasked: 'XXXX XXXX 9012',
      }),
    );
    expect(sendWelcomeCredentialsEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'aarav@mediflow.test' }),
    );
    expect(response).toEqual({
      patient: {
        _id: 'patient-1',
        name: 'Aarav Singh',
        email: 'aarav@mediflow.test',
        phone: '9999999999',
        medicalRecordNumber: 'MRN-1001',
        aadharMasked: 'XXXX XXXX 9012',
      },
      credentials: {
        email: 'aarav@mediflow.test',
        password: expect.any(String),
      },
    });
  });

  it('rejects duplicate patients before creating records', async () => {
    findExistingPatientByIdentifiersMock.mockResolvedValue({ _id: 'existing-patient' });

    await expect(createPatientOnboarding({
      input: {
        name: 'Duplicate Patient',
        email: 'duplicate@mediflow.test',
        phone: '9999999999',
        dob: '1995-01-10',
        gender: 'Male',
      },
      files: {},
      options: {
        requiredFields: ['name', 'email', 'phone', 'dob', 'gender'],
        duplicateMessage: 'Patient already exists',
      },
    })).rejects.toThrow('Patient already exists');

    expect(createPatientRecordMock).not.toHaveBeenCalled();
  });

  it('logs welcome-email failures without aborting patient creation', async () => {
    findExistingPatientByIdentifiersMock.mockResolvedValue(null);
    createPatientRecordMock.mockResolvedValue({ _id: 'patient-2', email: 'riya@mediflow.test' });
    sendWelcomeCredentialsEmailMock.mockRejectedValue(new Error('SMTP unavailable'));

    const response = await createPatientOnboarding({
      input: {
        name: 'Riya',
        email: 'riya@mediflow.test',
        phone: '7777777777',
        dob: '1996-02-20',
        gender: 'Female',
      },
      files: {},
      options: {
        requiredFields: ['name', 'email', 'phone', 'dob', 'gender'],
      },
    });

    expect(logEmailFailureMock).toHaveBeenCalledWith('patient welcome email', expect.any(Error));
    expect(response.patient).toEqual({ _id: 'patient-2', email: 'riya@mediflow.test' });
  });
});
