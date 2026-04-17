import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';

const defaultSettings = {
  cancellationWindow: 24,
  privacyPolicyVersion: '2026-04',
  deletionReviewWindowDays: 30,
};

const Settings = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [settings, setSettings] = useState(defaultSettings);
  const [privacyRequests, setPrivacyRequests] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingPrivacyRequests, setLoadingPrivacyRequests] = useState(false);
  const [submittingRequestId, setSubmittingRequestId] = useState('');

  const getSettings = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/get-settings`, { headers: { aToken } });
      if (data.success) {
        setSettings({
          cancellationWindow: data.settings.cancellationWindow ?? 24,
          privacyPolicyVersion: data.settings.privacyPolicyVersion ?? '2026-04',
          deletionReviewWindowDays: data.settings.deletionReviewWindowDays ?? 30,
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getPrivacyRequests = async () => {
    try {
      setLoadingPrivacyRequests(true);
      const { data } = await axios.get(`${backendUrl}/api/admin/privacy-requests`, { headers: { aToken } });

      if (data.success) {
        const requests = data.requests || [];
        setPrivacyRequests(requests);
        setReviewDrafts((current) => {
          const nextDrafts = { ...current };
          requests.forEach((request) => {
            nextDrafts[request._id] = nextDrafts[request._id] || {
              status: request.status === 'pending' ? 'in_review' : request.status,
              reviewNotes: request.reviewNotes || '',
              responseMessage: request.responseMessage || '',
            };
          });
          return nextDrafts;
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingPrivacyRequests(false);
    }
  };

  const updateSettings = async () => {
    try {
      setSavingSettings(true);
      const { data } = await axios.post(`${backendUrl}/api/admin/update-settings`, settings, { headers: { aToken } });
      if (data.success) {
        toast.success(data.message);
        await getSettings();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const updateReviewDraft = (requestId, field, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] || {}),
        [field]: value,
      },
    }));
  };

  const submitReview = async (requestId) => {
    try {
      setSubmittingRequestId(requestId);
      const draft = reviewDrafts[requestId];
      const { data } = await axios.post(
        `${backendUrl}/api/admin/privacy-requests/${requestId}/review`,
        draft,
        { headers: { aToken } },
      );

      if (data.success) {
        toast.success(data.message);
        await getPrivacyRequests();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingRequestId('');
    }
  };

  useEffect(() => {
    if (aToken) {
      getSettings();
      getPrivacyRequests();
    }
  }, [aToken]);

  const requestStats = useMemo(() => ({
    pending: privacyRequests.filter((request) => request.status === 'pending').length,
    active: privacyRequests.filter((request) => ['pending', 'in_review', 'approved'].includes(request.status)).length,
    completed: privacyRequests.filter((request) => request.status === 'completed').length,
  }), [privacyRequests]);

  return (
    <div className="m-5 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">System settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Manage operational rules, privacy policy versioning, and the review queue for export and deletion requests.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Cancellation window (hours)</label>
            <p className="mt-1 text-xs text-slate-500">Allowed range: 1 to 168 hours before an appointment.</p>
            <input
              type="number"
              className="mt-3 w-full rounded-xl border px-3 py-2"
              value={settings.cancellationWindow}
              onChange={(event) => setSettings((current) => ({
                ...current,
                cancellationWindow: Number(event.target.value),
              }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Privacy policy version</label>
            <p className="mt-1 text-xs text-slate-500">Patients are asked to refresh consent when this version changes.</p>
            <input
              className="mt-3 w-full rounded-xl border px-3 py-2"
              value={settings.privacyPolicyVersion}
              onChange={(event) => setSettings((current) => ({
                ...current,
                privacyPolicyVersion: event.target.value,
              }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Deletion review window (days)</label>
            <p className="mt-1 text-xs text-slate-500">Displayed to patients when they submit an account deletion request.</p>
            <input
              type="number"
              className="mt-3 w-full rounded-xl border px-3 py-2"
              value={settings.deletionReviewWindowDays}
              onChange={(event) => setSettings((current) => ({
                ...current,
                deletionReviewWindowDays: Number(event.target.value),
              }))}
            />
          </div>
        </div>

        <button
          onClick={updateSettings}
          disabled={savingSettings}
          className="mt-6 rounded-xl bg-primary px-4 py-2 text-white"
        >
          {savingSettings ? 'Saving settings...' : 'Update settings'}
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Privacy queue</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Review privacy requests</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Export requests are logged automatically. Deletion requests can be moved through review, approval, rejection, or completion from here.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Pending: <span className="font-semibold text-slate-900">{requestStats.pending}</span></div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Active: <span className="font-semibold text-slate-900">{requestStats.active}</span></div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Completed: <span className="font-semibold text-slate-900">{requestStats.completed}</span></div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loadingPrivacyRequests ? <p className="text-sm text-slate-500">Loading privacy requests...</p> : null}

          {!loadingPrivacyRequests && privacyRequests.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">No privacy requests have been recorded yet.</p>
          ) : null}

          {privacyRequests.map((request) => {
            const draft = reviewDrafts[request._id] || {
              status: request.status,
              reviewNotes: request.reviewNotes || '',
              responseMessage: request.responseMessage || '',
            };
            const isCompleted = request.status === 'completed';
            const isExport = request.type === 'data_export';

            return (
              <div key={request._id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                        {request.type.replace(/_/g, ' ')}
                      </p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                        {request.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">{request.user?.name || 'Unknown patient'}</p>
                    <p className="text-sm text-slate-500">{request.user?.email || 'No email available'}</p>
                    <p className="text-xs text-slate-500">
                      Requested on {new Date(request.requestedAt || request.createdAt).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>MRN: {request.user?.medicalRecordNumber || 'N/A'}</span>
                      <span>Aadhaar: {request.user?.aadharMasked || 'N/A'}</span>
                      <span>Account: {(request.user?.accountStatus || 'active').replace(/_/g, ' ')}</span>
                    </div>
                    {request.reason ? <p className="text-sm text-slate-600">{request.reason}</p> : null}
                  </div>

                  <div className="grid w-full gap-3 xl:max-w-xl">
                    <select
                      className="rounded-xl border px-3 py-2"
                      value={draft.status}
                      onChange={(event) => updateReviewDraft(request._id, 'status', event.target.value)}
                      disabled={isCompleted || isExport}
                    >
                      <option value="in_review">In review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>

                    <textarea
                      rows={3}
                      className="rounded-xl border px-3 py-2"
                      placeholder="Internal review notes"
                      value={draft.reviewNotes}
                      onChange={(event) => updateReviewDraft(request._id, 'reviewNotes', event.target.value)}
                      disabled={isCompleted || isExport}
                    />

                    <textarea
                      rows={2}
                      className="rounded-xl border px-3 py-2"
                      placeholder="Optional patient-facing response"
                      value={draft.responseMessage}
                      onChange={(event) => updateReviewDraft(request._id, 'responseMessage', event.target.value)}
                      disabled={isCompleted || isExport}
                    />

                    {request.reviewNotes ? <p className="text-xs text-slate-500">Saved note: {request.reviewNotes}</p> : null}
                    {request.responseMessage ? <p className="text-xs text-slate-500">Saved response: {request.responseMessage}</p> : null}

                    <button
                      onClick={() => submitReview(request._id)}
                      disabled={isCompleted || isExport || submittingRequestId === request._id}
                      className="rounded-xl bg-primary px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isExport
                        ? 'Export requests are auto-completed'
                        : submittingRequestId === request._id
                          ? 'Saving review...'
                          : isCompleted
                            ? 'Request completed'
                            : 'Save review'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Settings;
