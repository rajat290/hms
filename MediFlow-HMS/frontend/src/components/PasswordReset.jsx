import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell';
import { AppContext } from '../context/AppContext';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { backendUrl, persistSession } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setStep(2);
    }
  }, [searchParams]);

  const requestReset = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/forgot-password`, { email });
      if (data.success) {
        toast.success('Reset link sent to your email.');
        setStep(2);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/reset-password`, { token, newPassword });
      if (data.success) {
        toast.success('Password reset successfully.');
        if (data.token) {
          persistSession(data.token, data.refreshToken);
        }
        setTimeout(() => navigate('/'), 1500);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Password recovery"
      title={step === 1 ? 'Reset your password without the usual friction.' : 'Set a new password and return to care.'}
      description="Recovery is now designed as a real flow with a proper layout, calmer copy, and clearer progression between requesting a link and finishing the reset."
      asideTitle="Security improvements"
      asidePoints={[
        { title: 'Short, clear steps', copy: 'Patients can request a reset link and complete the update without deciphering a generic form.' },
        { title: 'Stronger clarity', copy: 'Error and success states feel intentional instead of tacked on.' },
      ]}
    >
      <form onSubmit={step === 1 ? requestReset : resetPassword} className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Step {step} of 2</p>
          <h2 className="mt-3 text-3xl font-bold text-secondary">{step === 1 ? 'Request a reset link' : 'Create your new password'}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {step === 1
              ? 'Enter the email attached to your patient account and we will send a secure recovery link.'
              : 'Paste the reset token if needed and choose a strong new password to continue.'}
          </p>
        </div>

        {step === 1 ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary">Email address</label>
            <input value={email} onChange={(event) => setEmail(event.target.value)} className="app-input" type="email" required />
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Reset token</label>
              <input value={token} onChange={(event) => setToken(event.target.value)} className="app-input" type="text" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">New password</label>
              <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="app-input" type="password" required />
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button disabled={submitting} className="app-button">
            {submitting ? (step === 1 ? 'Sending link...' : 'Resetting password...') : step === 1 ? 'Send reset link' : 'Reset password'}
          </button>
          <button type="button" onClick={() => navigate('/login')} className="app-button-secondary">
            Back to login
          </button>
        </div>
      </form>
    </AuthShell>
  );
};

export default PasswordReset;
