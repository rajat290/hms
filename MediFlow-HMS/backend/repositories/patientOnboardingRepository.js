import userModel from '../models/userModel.js';

const findExistingPatientByIdentifiers = (identifiers) => userModel.findOne({
    $or: identifiers,
});

const createPatientRecord = async (patientData) => {
    const patient = new userModel(patientData);
    return patient.save();
};

export { createPatientRecord, findExistingPatientByIdentifiers };
