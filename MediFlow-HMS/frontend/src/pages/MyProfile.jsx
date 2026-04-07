import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import PatientPortalLayout from '../components/PatientPortalLayout';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';

const fallbackProfile = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  dob: '',
  image: assets.profile_pic,
  bloodGroup: '',
  knownAllergies: '',
  currentMedications: '',
  insuranceProvider: '',
  insuranceId: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  emergencyContact: {
    name: '',
    phone: '',
  },
};

const MyProfile = () => {
  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(false);
  const [financials, setFinancials] = useState({ totalPaid: 0, pendingDues: 0 });

  const { token, backendUrl, userData, setUserData, loadUserProfileData, currencySymbol, profileLoading } = useContext(AppContext);

  const safeUserData = useMemo(
    () => ({
      ...fallbackProfile,
      ...userData,
      address: { ...fallbackProfile.address, ...(userData?.address || {}) },
      emergencyContact: { ...fallbackProfile.emergencyContact, ...(userData?.emergencyContact || {}) },
    }),
    [userData],
  );

  useEffect(() => {
    if (token) {
      axios
        .get(`${backendUrl}/api/user/financial-summary`, { headers: { token } })
        .then((response) => {
          if (response.data.success) {
            setFinancials({ totalPaid: response.data.totalPaid, pendingDues: response.data.pendingDues });
          }
        })
        .catch((error) => console.log(error));
    }
  }, [backendUrl, token]);

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData();
      formData.append('name', safeUserData.name);
      formData.append('phone', safeUserData.phone);
      formData.append('address', JSON.stringify(safeUserData.address));
      formData.append('gender', safeUserData.gender);
      formData.append('dob', safeUserData.dob);
      formData.append('bloodGroup', safeUserData.bloodGroup || '');
      formData.append('knownAllergies', safeUserData.knownAllergies || '');
      formData.append('currentMedications', safeUserData.currentMedications || '');
      formData.append('insuranceProvider', safeUserData.insuranceProvider || '');
      formData.append('insuranceId', safeUserData.insuranceId || '');
      formData.append('emergencyContact', JSON.stringify(safeUserData.emergencyContact));

      if (image) {
        formData.append('image', image);
      }

      const { data } = await axios.post(`${backendUrl}/api/user/update-profile`, formData, { headers: { token } });

      if (data.success) {
        toast.success(data.message);
        await loadUserProfileData();
        setIsEdit(false);
        setImage(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateField = (field, value) => {
    setUserData((current) => ({ ...(current || {}), [field]: value }));
  };

  const updateNestedField = (section, field, value) => {
    setUserData((current) => ({
      ...(current || {}),
      [section]: {
        ...(current?.[section] || fallbackProfile[section]),
        [field]: value,
      },
    }));
  };

  if (!token) {
    return (
      <div className="section-space">
        <EmptyState
          title="Sign in to manage your profile"
          description="Your patient profile stores contact details, health context, emergency contacts, and billing summary."
          action={<Link to="/login" className="app-button">Go to login</Link>}
        />
      </div>
    );
  }

  if (profileLoading && !userData) {
    return <LoadingState title="Loading profile" message="Bringing in your account details, health information, and contact settings." fullHeight />;
  }

  return (
    <PatientPortalLayout
      title="Profile"
      description="A more complete patient profile with cleaner editing, stronger grouping, and a clearer health and financial overview."
      stats={[
        { label: 'Total paid', value: `${currencySymbol}${financials.totalPaid}` },
        { label: 'Pending dues', value: `${currencySymbol}${financials.pendingDues}` },
        { label: 'Profile mode', value: isEdit ? 'Editing' : 'Viewing' },
      ]}
      actions={
        isEdit ? (
          <>
            <button onClick={updateUserProfileData} className="app-button">
              Save changes
            </button>
            <button onClick={() => setIsEdit(false)} className="app-button-secondary">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setIsEdit(true)} className="app-button">
            Edit profile
          </button>
        )
      }
    >
      <article className="app-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="relative">
            <img
              className="h-32 w-32 rounded-[30px] border border-white/80 object-cover shadow-soft"
              src={image ? URL.createObjectURL(image) : safeUserData.image}
              alt={safeUserData.name}
            />
            {isEdit ? (
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-[30px] bg-secondary/35 text-sm font-semibold text-white">
                Change
                <input type="file" hidden onChange={(event) => setImage(event.target.files[0])} />
              </label>
            ) : null}
          </div>

          <div className="flex-1">
            {isEdit ? (
              <input
                value={safeUserData.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="app-input text-2xl font-bold"
              />
            ) : (
              <h2 className="text-4xl font-bold text-secondary">{safeUserData.name}</h2>
            )}
            <p className="mt-2 text-sm font-semibold text-primary">Patient account overview</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{safeUserData.email}</p>
          </div>
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="app-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Contact information</p>
          <div className="mt-5 grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Phone</label>
              {isEdit ? (
                <input value={safeUserData.phone} onChange={(event) => updateField('phone', event.target.value)} className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Address line 1</label>
              {isEdit ? (
                <input value={safeUserData.address.line1} onChange={(event) => updateNestedField('address', 'line1', event.target.value)} className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.address.line1 || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Address line 2</label>
              {isEdit ? (
                <input value={safeUserData.address.line2} onChange={(event) => updateNestedField('address', 'line2', event.target.value)} className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.address.line2 || 'Not provided'}</p>
              )}
            </div>
          </div>
        </article>

        <article className="app-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Personal details</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Gender</label>
              {isEdit ? (
                <select value={safeUserData.gender} onChange={(event) => updateField('gender', event.target.value)} className="app-select">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.gender || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Date of birth</label>
              {isEdit ? (
                <input value={safeUserData.dob} onChange={(event) => updateField('dob', event.target.value)} type="date" className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.dob || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Blood group</label>
              {isEdit ? (
                <input value={safeUserData.bloodGroup} onChange={(event) => updateField('bloodGroup', event.target.value)} className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.bloodGroup || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Emergency contact phone</label>
              {isEdit ? (
                <input value={safeUserData.emergencyContact.phone} onChange={(event) => updateNestedField('emergencyContact', 'phone', event.target.value)} className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.emergencyContact.phone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="app-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Medical context</p>
          <div className="mt-5 grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Known allergies</label>
              {isEdit ? (
                <textarea value={safeUserData.knownAllergies} onChange={(event) => updateField('knownAllergies', event.target.value)} className="app-textarea" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.knownAllergies || 'None added yet'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Current medications</label>
              {isEdit ? (
                <textarea value={safeUserData.currentMedications} onChange={(event) => updateField('currentMedications', event.target.value)} className="app-textarea" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.currentMedications || 'None added yet'}</p>
              )}
            </div>
          </div>
        </article>

        <article className="app-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Insurance and emergency</p>
          <div className="mt-5 grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Emergency contact name</label>
              {isEdit ? (
                <input value={safeUserData.emergencyContact.name} onChange={(event) => updateNestedField('emergencyContact', 'name', event.target.value)} className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.emergencyContact.name || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Insurance provider</label>
              {isEdit ? (
                <input value={safeUserData.insuranceProvider} onChange={(event) => updateField('insuranceProvider', event.target.value)} className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.insuranceProvider || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Insurance ID</label>
              {isEdit ? (
                <input value={safeUserData.insuranceId} onChange={(event) => updateField('insuranceId', event.target.value)} className="app-input" />
              ) : (
                <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{safeUserData.insuranceId || 'Not provided'}</p>
              )}
            </div>
          </div>
        </article>
      </div>
    </PatientPortalLayout>
  );
};

export default MyProfile;
