import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthShell from './AuthShell';
import LoadingState from './ui/LoadingState';
import { AppContext } from '../context/AppContext';

const EmailVerification = () => {
  const { backendUrl } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      toast.error('Invalid verification link.');
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const { data } = await axios.post(`${backendUrl}/api/user/verify-email`, { token });

        if (data.success) {
          setVerified(true);
          toast.success(data.message);
          setTimeout(() => navigate('/login'), 2500);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Verification failed.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [backendUrl, navigate, searchParams]);

  if (loading) {
    return <LoadingState title="Verifying your email" message="Please wait while we confirm your registration link." fullHeight />;
  }

  return (
    <AuthShell
      eyebrow="Email verification"
      title={verified ? 'Your account is now verified.' : 'This verification link is no longer valid.'}
      description={
        verified
          ? 'You can now sign in and use the patient portal with full access to booking and account features.'
          : 'The link may have expired or already been used. You can return to sign in or register again if needed.'
      }
      asideTitle="What happens next"
      asidePoints={[
        { title: 'Verified accounts move faster', copy: 'Patients can sign in, book, and receive reminder and billing updates without extra setup.' },
        { title: 'Clear recovery paths', copy: 'If verification fails, the UI now guides patients back instead of leaving them stranded.' },
      ]}
    >
      <div className="space-y-5">
        <div className={`rounded-[28px] px-6 py-6 ${verified ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">{verified ? 'Success' : 'Action needed'}</p>
          <p className="mt-3 text-2xl font-bold">{verified ? 'Email confirmed successfully.' : 'Verification failed.'}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={() => navigate('/login')} className="app-button">
            Go to login
          </button>
          {!verified ? (
            <button onClick={() => navigate('/login')} className="app-button-secondary">
              Create a new account
            </button>
          ) : null}
        </div>
      </div>
    </AuthShell>
  );
};

export default EmailVerification;
