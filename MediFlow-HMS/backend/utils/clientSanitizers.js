const USER_PRIVATE_FIELDS = [
    'password',
    'verificationToken',
    'resetToken',
    'resetTokenExpiry',
    'twoFactorCode',
    'twoFactorCodeExpiry',
];

const DOCTOR_PRIVATE_FIELDS = [
    'password',
    'verificationToken',
    'resetToken',
    'resetTokenExpiry',
    'slots_booked',
];

const STAFF_PRIVATE_FIELDS = [
    'password',
    'verificationToken',
    'resetToken',
    'resetTokenExpiry',
];

const cloneValue = (value) => {
    if (!value) {
        return value;
    }

    if (typeof value.toObject === 'function') {
        return value.toObject({ virtuals: false });
    }

    return JSON.parse(JSON.stringify(value));
};

const omitFields = (value, fields) => {
    const clonedValue = cloneValue(value);

    if (!clonedValue || typeof clonedValue !== 'object') {
        return clonedValue;
    }

    fields.forEach((field) => {
        delete clonedValue[field];
    });

    return clonedValue;
};

const pickFields = (value, fields) => fields.reduce((result, field) => {
    if (value?.[field] !== undefined) {
        result[field] = value[field];
    }

    return result;
}, {});

const maskIdentifier = (value, visibleCharacters = 4) => {
    const normalizedValue = String(value || '').replace(/\s+/g, '').trim();

    if (!normalizedValue) {
        return '';
    }

    if (normalizedValue.length <= visibleCharacters) {
        return '*'.repeat(normalizedValue.length);
    }

    const visibleTail = normalizedValue.slice(-visibleCharacters);
    const maskLength = Math.max(normalizedValue.length - visibleCharacters, visibleCharacters);

    return `${'*'.repeat(maskLength)}${visibleTail}`;
};

const sanitizeUserForClient = (user, { viewer = 'staff' } = {}) => {
    const sanitizedUser = omitFields(user, USER_PRIVATE_FIELDS);

    if (!sanitizedUser) {
        return sanitizedUser;
    }

    if (viewer !== 'self') {
        if (sanitizedUser.aadharNumber) {
            sanitizedUser.aadharNumber = maskIdentifier(sanitizedUser.aadharNumber);
        }

        if (sanitizedUser.insuranceId) {
            sanitizedUser.insuranceId = maskIdentifier(sanitizedUser.insuranceId);
        }
    }

    if (viewer !== 'admin') {
        delete sanitizedUser.aadharImage;
    }

    return sanitizedUser;
};

const sanitizeDoctorForClient = (doctor, { viewer = 'backoffice' } = {}) => {
    const sanitizedDoctor = omitFields(doctor, DOCTOR_PRIVATE_FIELDS);

    if (!sanitizedDoctor) {
        return sanitizedDoctor;
    }

    if (viewer === 'appointment') {
        return pickFields(sanitizedDoctor, [
            '_id',
            'name',
            'image',
            'speciality',
            'degree',
            'experience',
            'about',
            'available',
            'fees',
            'address',
            'paymentMethods',
        ]);
    }

    return sanitizedDoctor;
};

const sanitizeStaffForClient = (staff) => omitFields(staff, STAFF_PRIVATE_FIELDS);

const sanitizeAppointmentForClient = (appointment) => {
    const sanitizedAppointment = cloneValue(appointment);

    if (!sanitizedAppointment) {
        return sanitizedAppointment;
    }

    if (sanitizedAppointment.userData) {
        sanitizedAppointment.userData = pickFields(
            sanitizeUserForClient(sanitizedAppointment.userData, { viewer: 'appointment' }),
            [
                '_id',
                'name',
                'email',
                'phone',
                'gender',
                'dob',
                'image',
                'medicalRecordNumber',
                'bloodGroup',
                'knownAllergies',
                'currentMedications',
                'patientCategory',
                'emergencyContact',
            ],
        );
    }

    if (sanitizedAppointment.docData) {
        sanitizedAppointment.docData = sanitizeDoctorForClient(sanitizedAppointment.docData, { viewer: 'appointment' });
    }

    return sanitizedAppointment;
};

const buildAppointmentUserSnapshot = (user) => pickFields(
    sanitizeUserForClient(user, { viewer: 'appointment' }),
    [
        '_id',
        'name',
        'email',
        'phone',
        'gender',
        'dob',
        'image',
        'medicalRecordNumber',
        'bloodGroup',
        'knownAllergies',
        'currentMedications',
        'patientCategory',
        'emergencyContact',
    ],
);

const buildAppointmentDoctorSnapshot = (doctor) => sanitizeDoctorForClient(doctor, { viewer: 'appointment' });

export {
    buildAppointmentDoctorSnapshot,
    buildAppointmentUserSnapshot,
    maskIdentifier,
    sanitizeAppointmentForClient,
    sanitizeDoctorForClient,
    sanitizeStaffForClient,
    sanitizeUserForClient,
};
