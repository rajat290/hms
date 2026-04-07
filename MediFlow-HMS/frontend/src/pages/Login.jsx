import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { AppContext } from '../context/AppContext';

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, token, persistSession } = useContext(AppContext);

  const [state, setState] = useState('Sign Up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [is2fa, setIs2fa] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [userId, setUserId] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateEmail = (value) =>
    String(value)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

  const handleEmailChange = (event) => {
    const value = event.target.value;
    setEmail(value);
    setErrors((current) => ({
      ...current,
      email: value && !validateEmail(value) ? 'Please enter a valid email address.' : '',
    }));
  };

  const handlePasswordChange = (event) => {
    const value = event.target.value;
    setPassword(value);
    setErrors((current) => ({
      ...current,
      password: state === 'Sign Up' && value.length > 0 && value.length < 8 ? 'Password must be at least 8 characters long.' : '',
    }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password });

        if (data.success) {
          toast.success('Registration successful. Please verify your email to continue.');
          setState('Login');
          setPassword('');
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password });

        if (data.success) {
          if (data.twoFactorRequired) {
            setIs2fa(true);
            setUserId(data.userId);
            toast.info(data.message);
          } else {
            persistSession(data.token, data.refreshToken);
            toast.success('Welcome back.');
          }
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const onVerify2fa = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/verify-2fa`, { userId, code: twoFactorCode });

      if (data.success) {
        persistSession(data.token, data.refreshToken);
        toast.success('Verification complete.');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [navigate, token]);

  return (
    <AuthShell
      eyebrow={is2fa ? 'Step 2 of 2' : 'Patient authentication'}
      title={is2fa ? 'Confirm your sign-in securely.' : state === 'Sign Up' ? 'Create a modern patient account.' : 'Sign in to your patient portal.'}
      description={
        is2fa
          ? 'Two-factor verification adds an extra trust layer before opening the patient portal.'
          : 'The auth experience now feels like part of the product, with stronger hierarchy, calmer messaging, and cleaner form states.'
      }
      asideTitle="Why this flow feels stronger now"
      asidePoints={[
        { title: 'Clearer states', copy: 'Sign-up, login, and verification are visually separated so users always know where they are.' },
        { title: 'Better trust cues', copy: 'The layout feels more like a real healthcare product and less like a generic template.' },
        { title: 'Responsive by default', copy: 'The same experience scales cleanly from a wide desktop to a narrow phone screen.' },
      ]}
    >
      {is2fa ? (
        <form onSubmit={onVerify2fa} className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Two-factor verification</p>
            <h2 className="mt-3 text-3xl font-bold text-secondary">Enter the 6-digit code</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">We emailed a verification code to confirm that this login request is really yours.</p>
          </div>

          <input
            aria-label="Verification Code"
            type="text"
            maxLength="6"
            value={twoFactorCode}
            onChange={(event) => setTwoFactorCode(event.target.value)}
            className="app-input text-center text-2xl tracking-[0.4em]"
            required
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button disabled={loading} className="app-button justify-center">
              {loading ? 'Verifying...' : 'Verify and continue'}
            </button>
            <button type="button" onClick={() => setIs2fa(false)} className="app-button-secondary justify-center">
              Back to login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmitHandler} className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{state === 'Sign Up' ? 'New patient account' : 'Existing patient access'}</p>
            <h2 className="mt-3 text-3xl font-bold text-secondary">{state === 'Sign Up' ? 'Set up your patient profile' : 'Welcome back'}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              {state === 'Sign Up'
                ? 'Register once to manage appointments, invoices, reminders, and profile details in one place.'
                : 'Sign in to continue where you left off, whether that is booking, billing, or an upcoming consultation.'}
            </p>
          </div>

          {state === 'Sign Up' ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Full name</label>
              <input value={name} onChange={(event) => setName(event.target.value)} className="app-input" type="text" required />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary">Email address</label>
            <input value={email} onChange={handleEmailChange} className="app-input" type="email" required />
            {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary">Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={handlePasswordChange}
                className="app-input pr-12"
                type={showPassword ? 'text' : 'password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-semibold text-slate-400 hover:text-primary"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button disabled={loading} className="app-button justify-center">
              {loading ? (state === 'Sign Up' ? 'Creating account...' : 'Signing in...') : state === 'Sign Up' ? 'Create account' : 'Sign in'}
            </button>
            {state === 'Login' ? (
              <button type="button" onClick={() => navigate('/reset-password')} className="app-button-ghost justify-center">
                Forgot password?
              </button>
            ) : null}
          </div>

          <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
            {state === 'Sign Up' ? (
              <p>
                Already have an account?{' '}
                <button type="button" onClick={() => setState('Login')} className="font-semibold text-primary">
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                Need a new patient account?{' '}
                <button type="button" onClick={() => setState('Sign Up')} className="font-semibold text-primary">
                  Create one here
                </button>
              </p>
            )}
          </div>
        </form>
      )}
    </AuthShell>
  );
};

export default Login;
