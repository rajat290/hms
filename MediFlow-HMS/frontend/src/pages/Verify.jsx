import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthShell from '../components/AuthShell';
import LoadingState from '../components/ui/LoadingState';
import { AppContext } from '../context/AppContext';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const success = searchParams.get('success');
  const appointmentId = searchParams.get('appointmentId');
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const verifyStripe = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/user/verifyStripe`,
          { appointmentId, sessionId },
          { headers: { token } },
        );

        if (data.success) {
          toast.success(data.message);
          setStatus('success');
        } else {
          toast.error(data.message);
          setStatus('error');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || 'Payment verification failed.');
        setStatus('error');
      }
    };

    if (!token || !appointmentId || !success) {
      setStatus('error');
      return;
    }

    if (success === 'true' && sessionId) {
      verifyStripe();
      return;
    }

    if (success === 'false') {
      toast.error('Payment failed.');
      setStatus('error');
      return;
    }

    setStatus('error');
  }, [appointmentId, backendUrl, sessionId, success, token]);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => navigate('/my-appointments'), 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [navigate, status]);

  if (status === 'loading') {
    return <LoadingState title="Verifying payment" message="Confirming your payment with the gateway and updating your appointment." fullHeight />;
  }

  return (
    <AuthShell
      eyebrow="Payment verification"
      title={status === 'success' ? 'Payment verified successfully.' : 'We could not confirm this payment.'}
      description={
        status === 'success'
          ? 'Your appointment status has been updated and you will be redirected back to your appointments shortly.'
          : 'You will be redirected back to your appointments so you can retry or review the booking details.'
      }
      asideTitle="What this screen now improves"
      asidePoints={[
        { title: 'More explicit status', copy: 'Patients no longer stare at a spinner without context or next steps.' },
        { title: 'Clear return path', copy: 'The flow moves patients back to their portal instead of leaving them stuck on a utility page.' },
      ]}
    >
      <div className={`rounded-[28px] px-6 py-6 ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">{status === 'success' ? 'Payment confirmed' : 'Verification issue'}</p>
        <p className="mt-3 text-2xl font-bold">{status === 'success' ? 'Appointment updated.' : 'Please review your appointment.'}</p>
      </div>
    </AuthShell>
  );
};

export default Verify;
