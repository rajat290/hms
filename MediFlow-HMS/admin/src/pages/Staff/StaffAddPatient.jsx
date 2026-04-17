import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { StaffContext } from '../../context/StaffContext';
import { AppContext } from '../../context/AppContext';

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: 'Not Selected',
  medicalRecordNumber: '',
  aadharNumber: '',
  insuranceProvider: '',
  insuranceId: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  address1: '',
  address2: '',
};

const StaffAddPatient = () => {
  const { sToken } = useContext(StaffContext);
  const { backendUrl } = useContext(AppContext);

  const [form, setForm] = useState(defaultForm);
  const [profileImg, setProfileImg] = useState(null);
  const [aadharImg, setAadharImg] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [createdPatient, setCreatedPatient] = useState(null);

  const onInput = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (
      !form.name
      || !form.email
      || !form.phone
      || !form.dob
      || !form.medicalRecordNumber
      || !form.aadharNumber
      || !form.address1
      || form.gender === 'Not Selected'
    ) {
      toast.error('Please fill all required fields');
      return false;
    }

    const emailPattern = /.+@.+\..+/;
    if (!emailPattern.test(form.email)) {
      toast.error('Invalid email');
      return false;
    }

    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.error('Invalid phone');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setCreating(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('dob', form.dob);
      formData.append('gender', form.gender);
      formData.append('medicalRecordNumber', form.medicalRecordNumber);
      formData.append('aadharNumber', form.aadharNumber);
      formData.append('insuranceProvider', form.insuranceProvider);
      formData.append('insuranceId', form.insuranceId);
      formData.append('address', JSON.stringify({ line1: form.address1, line2: form.address2 }));
      formData.append(
        'emergencyContact',
        JSON.stringify({
          name: form.emergencyName,
          phone: form.emergencyPhone,
          relation: form.emergencyRelation,
        }),
      );

      if (profileImg) formData.append('image', profileImg);
      if (aadharImg) formData.append('aadharImage', aadharImg);

      const { data } = await axios.post(`${backendUrl}/api/staff/create-patient`, formData, { headers: { sToken } });

      if (data.success) {
        toast.success(data.message);
        setCreatedCredentials(data.credentials || data.loginCredentials || null);
        setCreatedPatient(data.patient || null);
        setForm(defaultForm);
        setProfileImg(null);
        setAadharImg(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const printCredentials = () => {
    window.print();
  };

  return (
    <div className="w-full px-4 sm:px-10">
      <div className="bg-white p-6 rounded border">
        <p className="text-xl font-semibold text-gray-700 mb-4">Add Patient</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Full Name *</label>
            <input aria-label="Full Name" name="name" value={form.name} onChange={onInput} className="w-full border rounded p-2" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm mb-1">Email *</label>
            <input aria-label="Email" name="email" value={form.email} onChange={onInput} className="w-full border rounded p-2" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Phone *</label>
            <input aria-label="Phone" name="phone" value={form.phone} onChange={onInput} className="w-full border rounded p-2" placeholder="9999999999" />
          </div>
          <div>
            <label className="block text-sm mb-1">Date of Birth *</label>
            <input aria-label="Date of Birth" type="date" name="dob" value={form.dob} onChange={onInput} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Gender *</label>
            <select aria-label="Gender" name="gender" value={form.gender} onChange={onInput} className="w-full border rounded p-2">
              <option>Not Selected</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Medical Record Number (MRN) *</label>
            <input aria-label="Medical Record Number" name="medicalRecordNumber" value={form.medicalRecordNumber} onChange={onInput} className="w-full border rounded p-2" placeholder="MRN-00123" />
          </div>
          <div>
            <label className="block text-sm mb-1">Insurance Provider</label>
            <input aria-label="Insurance Provider" name="insuranceProvider" value={form.insuranceProvider} onChange={onInput} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Insurance ID</label>
            <input aria-label="Insurance ID" name="insuranceId" value={form.insuranceId} onChange={onInput} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Aadhaar Number *</label>
            <input aria-label="Aadhaar Number" name="aadharNumber" value={form.aadharNumber} onChange={onInput} className="w-full border rounded p-2" placeholder="XXXX-XXXX-XXXX" />
          </div>
          <div>
            <label className="block text-sm mb-1">Emergency Contact Name</label>
            <input aria-label="Emergency Contact Name" name="emergencyName" value={form.emergencyName} onChange={onInput} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Emergency Contact Phone</label>
            <input aria-label="Emergency Contact Phone" name="emergencyPhone" value={form.emergencyPhone} onChange={onInput} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Emergency Relation</label>
            <input aria-label="Emergency Relation" name="emergencyRelation" value={form.emergencyRelation} onChange={onInput} className="w-full border rounded p-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Address Line 1 *</label>
            <input aria-label="Address Line 1" name="address1" value={form.address1} onChange={onInput} className="w-full border rounded p-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Address Line 2</label>
            <input aria-label="Address Line 2" name="address2" value={form.address2} onChange={onInput} className="w-full border rounded p-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm mb-1">Profile Image</label>
            <input aria-label="Profile Image" type="file" accept="image/*" onChange={(event) => setProfileImg(event.target.files[0])} />
          </div>
          <div>
            <label className="block text-sm mb-1">Aadhaar Image</label>
            <input aria-label="Aadhaar Image" type="file" accept="image/*" onChange={(event) => setAadharImg(event.target.files[0])} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={creating} className="mt-6 bg-primary text-white px-6 py-2 rounded">
          {creating ? 'Creating...' : 'Create Patient'}
        </button>
      </div>

      {createdCredentials && createdPatient ? (
        <div className="bg-white p-6 rounded border mt-6">
          <p className="text-lg font-semibold text-gray-700 mb-2">Patient Created</p>
          <p className="text-sm text-gray-700">Name: {createdPatient.name}</p>
          <p className="text-sm text-gray-700">Email: {createdPatient.email}</p>
          <p className="text-sm text-gray-700">Phone: {createdPatient.phone}</p>
          <p className="text-sm text-gray-700">MRN: {createdPatient.medicalRecordNumber}</p>
          <p className="text-sm text-gray-700">Aadhaar reference: {createdPatient.aadharMasked || 'Stored securely'}</p>
          <p className="text-sm text-gray-700">Account status: {createdPatient.accountStatus || 'active'}</p>

          <div className="mt-4 bg-gray-50 border rounded p-4">
            <p className="font-medium text-gray-800 mb-2">Login Credentials</p>
            <p className="text-sm text-gray-700">Email: {createdCredentials.email}</p>
            <p className="text-sm text-gray-700">Temporary Password: {createdCredentials.password}</p>
            <button onClick={printCredentials} className="mt-3 border border-primary text-primary px-4 py-1 rounded">Print</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StaffAddPatient;
