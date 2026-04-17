import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { AppContext } from '../context/AppContext';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const requestReset = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/forgot-password`, { email });
      if (data.success) {
        toast.success(data.message || 'If the account exists, a reset code has been sent.');
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

  const verifyCode = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/verify-reset-otp`, { email, code });
      if (data.success) {
        setToken(data.resetToken);
        toast.success(data.message || 'Code verified.');
        setStep(3);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Code verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/reset-password`, { token, newPassword });
      if (data.success) {
        toast.success(data.message || 'Password reset successfully.');
        setTimeout(() => navigate('/login'), 1400);
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
      title={
        step === 1
          ? 'Reset your password without leaving the app.'
          : step === 2
            ? 'Paste your recovery code to keep moving.'
            : 'Set a new password and return to login.'
      }
      description="Recovery now follows a simpler OTP pattern: request a code, verify it in the same screen, then create a new password without dealing with email links."
      asideTitle="Security improvements"
      asidePoints={[
        { title: 'Short, clear steps', copy: 'Patients can request a 6-digit code, verify it, and finish recovery in one smooth flow.' },
        { title: 'Less friction', copy: 'There is no need to switch tabs and open reset links while trying to book care quickly.' },
      ]}
    >
      <form onSubmit={step === 1 ? requestReset : step === 2 ? verifyCode : resetPassword} className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Step {step} of 3</p>
          <h2 className="mt-3 text-3xl font-bold text-secondary">
            {step === 1 ? 'Request a reset code' : step === 2 ? 'Verify your code' : 'Create your new password'}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {step === 1
              ? 'Enter the email attached to your patient account and we will send a secure 6-digit recovery code.'
              : step === 2
                ? 'Paste the 6-digit code from your email. Once it is verified, you can choose a new password.'
                : 'Choose a strong new password, confirm it, and we will send you back to the login screen.'}
          </p>
        </div>

        {step === 1 ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary">Email address</label>
            <input value={email} onChange={(event) => setEmail(event.target.value)} className="app-input" type="email" required />
          </div>
        ) : step === 2 ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Email address</label>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="app-input" type="email" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">6-digit code</label>
              <input value={code} onChange={(event) => setCode(event.target.value)} className="app-input text-center text-2xl tracking-[0.38em]" type="text" maxLength="6" required />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">New password</label>
              <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="app-input" type="password" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Confirm password</label>
              <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="app-input" type="password" required />
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button disabled={submitting} className="app-button">
            {submitting
              ? step === 1
                ? 'Sending code...'
                : step === 2
                  ? 'Verifying code...'
                  : 'Updating password...'
              : step === 1
                ? 'Send reset code'
                : step === 2
                  ? 'Verify code'
                  : 'Save new password'}
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
