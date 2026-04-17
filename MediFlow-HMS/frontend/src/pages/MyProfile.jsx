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
  medicalRecordNumber: '',
  aadharMasked: '',
  bloodGroup: '',
  knownAllergies: '',
  currentMedications: '',
  insuranceProvider: '',
  insuranceId: '',
  accountStatus: 'active',
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
  const [privacySummary, setPrivacySummary] = useState({
    policyVersion: '',
    deletionReviewWindowDays: 30,
    accountStatus: 'active',
    consent: null,
    requests: [],
  });
  const [privacyApiAvailable, setPrivacyApiAvailable] = useState(true);
  const [privacyReason, setPrivacyReason] = useState('');
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [privacyRequestLoading, setPrivacyRequestLoading] = useState(false);

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

  const activeDeletionRequest = useMemo(
    () => privacySummary.requests.find((request) => (
      request.type === 'account_deletion'
      && ['pending', 'in_review', 'approved'].includes(request.status)
    )),
    [privacySummary.requests],
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

  const loadPrivacySummary = async () => {
    if (!token) {
      setPrivacyApiAvailable(true);
      setPrivacySummary({
        policyVersion: '',
        deletionReviewWindowDays: 30,
        accountStatus: 'active',
        consent: null,
        requests: [],
      });
      return;
    }

    try {
      setPrivacyLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/user/privacy-summary`, { headers: { token } });

      if (data.success) {
        setPrivacyApiAvailable(true);
        setPrivacySummary({
          policyVersion: data.policyVersion,
          deletionReviewWindowDays: data.deletionReviewWindowDays,
          accountStatus: data.accountStatus || 'active',
          consent: data.consent,
          requests: data.requests || [],
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error?.response?.status === 404) {
        setPrivacyApiAvailable(false);
        setPrivacySummary({
          policyVersion: '',
          deletionReviewWindowDays: 30,
          accountStatus: safeUserData.accountStatus || 'active',
          consent: null,
          requests: [],
        });
      } else {
        toast.error(error.message);
      }
    } finally {
      setPrivacyLoading(false);
    }
  };

  useEffect(() => {
    loadPrivacySummary();
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

  const downloadPrivacyExport = async () => {
    if (!privacyApiAvailable) {
      return;
    }

    try {
      setExportLoading(true);
      const response = await axios.get(`${backendUrl}/api/user/privacy-export`, {
        headers: { token },
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename=\"?([^"]+)\"?/i);
      const filename = filenameMatch?.[1] || 'mediflow-privacy-export.json';
      const downloadUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Your privacy export is ready.');
      await loadPrivacySummary();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const recordPrivacyConsent = async () => {
    if (!privacyApiAvailable) {
      return;
    }

    try {
      setConsentLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/user/privacy-consent`, {}, { headers: { token } });

      if (data.success) {
        toast.success(data.message);
        await loadUserProfileData();
        await loadPrivacySummary();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setConsentLoading(false);
    }
  };

  const submitDeletionRequest = async () => {
    if (!privacyApiAvailable) {
      return;
    }

    try {
      setPrivacyRequestLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/user/privacy-requests`,
        { type: 'account_deletion', reason: privacyReason },
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message);
        setPrivacyReason('');
        await loadUserProfileData();
        await loadPrivacySummary();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPrivacyRequestLoading(false);
    }
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

      <article className="app-card p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Data and privacy</p>
            <h3 className="mt-2 text-2xl font-bold text-secondary">Control how your account data is handled</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Keep your privacy consent current, download a copy of your account data, and submit a deletion request for manual review.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Consent</p>
              <p className="mt-2 text-sm font-semibold text-secondary">
                {privacySummary.consent?.isCurrent ? 'Up to date' : privacySummary.consent ? 'Needs refresh' : 'Not recorded'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {privacySummary.consent?.version ? `Version ${privacySummary.consent.version}` : 'Waiting for acknowledgment'}
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Account status</p>
              <p className="mt-2 text-sm font-semibold capitalize text-secondary">
                {(privacySummary.accountStatus || safeUserData.accountStatus || 'active').replace(/_/g, ' ')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {activeDeletionRequest ? `Deletion request is ${activeDeletionRequest.status.replace(/_/g, ' ')}` : 'No active deletion workflow'}
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Identity reference</p>
              <p className="mt-2 text-sm font-semibold text-secondary">{safeUserData.aadharMasked || 'Not added'}</p>
              <p className="mt-1 text-xs text-slate-500">Stored as a masked reference for support and verification.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4 rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
            <div>
              <p className="text-sm font-semibold text-secondary">Consent and export</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Current policy version: <span className="font-semibold text-slate-700">{privacySummary.policyVersion || 'Not available'}</span>
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Deletion review window: <span className="font-semibold text-slate-700">{privacySummary.deletionReviewWindowDays} days</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={recordPrivacyConsent} disabled={consentLoading || !privacyApiAvailable} className="app-button">
                {consentLoading ? 'Saving consent...' : privacySummary.consent?.isCurrent ? 'Refresh consent record' : 'Record privacy consent'}
              </button>
              <button onClick={downloadPrivacyExport} disabled={exportLoading || !privacyApiAvailable} className="app-button-secondary">
                {exportLoading ? 'Preparing export...' : 'Download my data'}
              </button>
            </div>

            {!privacyApiAvailable ? (
              <p className="text-xs text-slate-500">
                Privacy tools are unavailable in the current API session right now, so the profile page stays usable without showing a route error.
              </p>
            ) : privacySummary.consent?.acceptedAt ? (
              <p className="text-xs text-slate-500">
                Last acknowledged on {new Date(privacySummary.consent.acceptedAt).toLocaleString()} via {privacySummary.consent.source}.
              </p>
            ) : (
              <p className="text-xs text-slate-500">No privacy consent acknowledgment has been recorded yet.</p>
            )}
          </div>

          <div className="space-y-4 rounded-[28px] border border-rose-100 bg-rose-50/70 p-5">
            <div>
              <p className="text-sm font-semibold text-secondary">Deletion request</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Requests are reviewed manually before any irreversible action is taken so billing, clinical, and legal retention needs can be checked safely.
              </p>
            </div>

            <textarea
              value={privacyReason}
              onChange={(event) => setPrivacyReason(event.target.value)}
              className="app-textarea"
              rows={4}
              placeholder="Add an optional note for the admin team."
              disabled={!privacyApiAvailable || Boolean(activeDeletionRequest) || privacySummary.accountStatus === 'anonymized'}
            />

            <button
              onClick={submitDeletionRequest}
              disabled={!privacyApiAvailable || privacyRequestLoading || Boolean(activeDeletionRequest) || privacySummary.accountStatus === 'anonymized'}
              className="app-button"
            >
              {privacyRequestLoading ? 'Submitting request...' : activeDeletionRequest ? 'Deletion request already active' : 'Request account deletion'}
            </button>

            <p className="text-xs text-slate-500">
              {privacyLoading
                ? 'Refreshing privacy history...'
                : activeDeletionRequest
                  ? `Active request: ${activeDeletionRequest.status.replace(/_/g, ' ')}`
                  : 'No active deletion request on this account.'}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-secondary">Recent privacy activity</p>
          {!privacyApiAvailable ? (
            <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-500">Privacy history will appear here once the API exposes the privacy endpoints.</p>
          ) : privacySummary.requests.length > 0 ? privacySummary.requests.map((request) => (
            <div key={request._id} className="rounded-[24px] border border-slate-100 bg-white px-5 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{request.type.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Requested on {new Date(request.requestedAt || request.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  {request.status.replace(/_/g, ' ')}
                </p>
              </div>
              {request.reason ? <p className="mt-3 text-sm text-slate-600">{request.reason}</p> : null}
              {request.reviewNotes ? <p className="mt-2 text-xs text-slate-500">Review note: {request.reviewNotes}</p> : null}
              {request.responseMessage ? <p className="mt-1 text-xs text-slate-500">Response: {request.responseMessage}</p> : null}
            </div>
          )) : (
            <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-500">No privacy activity has been recorded yet.</p>
          )}
        </div>
      </article>

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
