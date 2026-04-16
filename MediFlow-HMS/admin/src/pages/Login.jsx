import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminContext } from '../context/AdminContext';
import { DoctorContext } from '../context/DoctorContext';
import { StaffContext } from '../context/StaffContext';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import { roleMeta } from '../utils/backofficeConfig';

const roles = ['Admin', 'Doctor', 'Staff'];

const Login = () => {
  const [view, setView] = useState('login');
  const [state, setState] = useState('Admin');
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const { persistDoctorSession, clearDoctorSession } = useContext(DoctorContext);
  const { persistAdminSession, clearAdminSession } = useContext(AdminContext);
  const { persistStaffSession, clearStaffSession } = useContext(StaffContext);

  const roleKey = state.toLowerCase();
  const roleDetails = roleMeta[roleKey];

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setView('reset');
    }

    const role = searchParams.get('role');
    if (role) {
      const roleState = role.charAt(0).toUpperCase() + role.slice(1);
      if (roles.includes(roleState)) {
        setState(roleState);
      }
    }
  }, [searchParams]);

  const roleQuote = useMemo(() => ({
    Admin: 'Keep operations visible, safe, and easy to act on.',
    Doctor: 'Stay focused on care, not on fighting the software.',
    Staff: 'Move the front desk faster with fewer clicks and less confusion.',
  }[state]), [state]);

  const validateEmail = (value) =>
    String(value)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );

  const handleEmailChange = (event) => {
    const value = event.target.value;
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: value && !validateEmail(value) ? 'Use a valid email address.' : '',
    }));
  };

  const handlePasswordChange = (event) => {
    const value = event.target.value;
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: value.length > 0 && value.length < 4 ? 'Minimum 4 characters required.' : '',
    }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (state === 'Admin') {
        const { data } = await axios.post(`${backendUrl}/api/admin/login`, { email, password });
        if (data.success) {
          clearDoctorSession();
          clearStaffSession();
          persistAdminSession(data.token, data.refreshToken);
        } else {
          toast.error(data.message);
        }
      } else if (state === 'Doctor') {
        const { data } = await axios.post(`${backendUrl}/api/doctor/login`, { email, password });
        if (data.success) {
          clearAdminSession();
          clearStaffSession();
          persistDoctorSession(data.token, data.refreshToken);
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/staff/login`, { email, password });
        if (data.success) {
          clearAdminSession();
          clearDoctorSession();
          persistStaffSession(data.token, data.refreshToken);
          navigate('/staff-dashboard');
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'forgot') return <ForgotPassword setView={setView} />;
  if (view === 'reset') return <ResetPassword setView={setView} />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.14),transparent_26%),linear-gradient(180deg,#0f172a_0%,#111827_36%,#f3f6f5_36%,#edf4f7_100%)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between rounded-[34px] border border-white/10 bg-white/6 p-7 text-white shadow-[0_28px_90px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:p-10">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-100">
              MediFlow Workspace
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Modern back-office software built for real hospital teams.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                One clean workspace for front desk, doctors, and administrators. Faster decisions, clearer records, and less training friction for non-technical users.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {roles.map((role) => {
                const active = role === state;
                const accent = roleMeta[role.toLowerCase()].accent;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setState(role)}
                    className={`rounded-[28px] border p-5 text-left transition ${active ? 'border-white/35 bg-white/14 shadow-xl' : 'border-white/10 bg-white/6 hover:border-white/25 hover:bg-white/10'}`}
                  >
                    <span className={`mb-4 inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white ${accent}`}>
                      {role}
                    </span>
                    <p className="text-lg font-semibold text-white">{roleMeta[role.toLowerCase()].label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{roleMeta[role.toLowerCase()].description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 rounded-[30px] border border-white/10 bg-white/8 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-100">Role focus</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{state}</p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-200">{roleQuote}</p>
          </div>
        </section>

        <section className="animate-fade-up flex items-center">
          <form
            onSubmit={onSubmitHandler}
            className="w-full rounded-[34px] border border-white/70 bg-white/92 p-7 shadow-[0_30px_100px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-10"
          >
            <div className="mb-8 space-y-3">
              <span className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white ${roleDetails.accent}`}>
                {state}
              </span>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to continue to your {state.toLowerCase()} workspace.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email address</label>
                <input
                  onChange={handleEmailChange}
                  value={email}
                  className="soft-input"
                  type="email"
                  placeholder="name@hospital.com"
                  required
                  aria-label="Email address"
                />
                {errors.email ? <p className="text-xs font-medium text-rose-500">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    onChange={handlePasswordChange}
                    value={password}
                    className="soft-input pr-12"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 inline-flex items-center text-sm font-medium text-slate-400 transition hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password ? <p className="text-xs font-medium text-rose-500">{errors.password}</p> : null}
              </div>

              <button
                disabled={loading}
                className="soft-button-primary w-full rounded-2xl py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  `Continue as ${state}`
                )}
              </button>
            </div>

            <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
              <div className="flex flex-wrap gap-2">
                {roles.filter((role) => role !== state).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setState(role)}
                    className="soft-button-secondary rounded-full px-4 py-2 text-xs"
                  >
                    Switch to {role}
                  </button>
                ))}
              </div>

              {state !== 'Admin' ? (
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-sm font-semibold text-teal-700 transition hover:text-teal-600"
                >
                  Forgot password?
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
