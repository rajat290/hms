import React, { useContext, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';

const primaryLinks = [
  { to: '/', label: 'Home' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const careLinks = [
  { to: '/my-profile', label: 'Profile' },
  { to: '/my-appointments', label: 'Appointments' },
  { to: '/my-billing', label: 'Billing' },
  { to: '/notifications', label: 'Notifications' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userData, logout } = useContext(AppContext);
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const showCompactChrome = useMemo(
    () =>
      ['/login', '/reset-password', '/verify', '/verify-email'].some((route) =>
        location.pathname.startsWith(route),
      ),
    [location.pathname],
  );

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
    setShowAccountMenu(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/65 backdrop-blur-2xl">
      <div className="page-wrap">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-2 shadow-soft">
              <img src={assets.logo} alt="MediFlow" className="w-28 sm:w-32" />
            </div>
            {!showCompactChrome ? (
              <div className="hidden xl:block">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Digital care platform</p>
                <p className="text-sm text-slate-500">Book, manage, and follow up in one place</p>
              </div>
            ) : null}
          </Link>

          {!showCompactChrome ? (
            <nav className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/80 px-2 py-2 lg:flex">
              {primaryLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold ${
                      isActive ? 'bg-secondary text-white shadow-lg shadow-secondary/10' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          ) : null}

          <div className="flex items-center gap-3">
            {!showCompactChrome ? (
              <>
                <Link to="/smart-scheduler" className="hidden rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary xl:inline-flex">
                  Smart scheduler
                </Link>
                <Link to="/symptom-checker" className="hidden rounded-full border border-secondary/10 bg-white px-4 py-2 text-sm font-semibold text-secondary shadow-sm xl:inline-flex">
                  AI symptom checker
                </Link>
              </>
            ) : null}

            {token && userData ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowAccountMenu((current) => !current)}
                  className="flex items-center gap-3 rounded-full border border-white/80 bg-white px-2 py-2 shadow-soft"
                >
                  <img
                    className="h-11 w-11 rounded-full object-cover"
                    src={userData.image || assets.profile_pic}
                    alt={userData.name}
                  />
                  <div className="hidden text-left lg:block">
                    <p className="text-sm font-bold text-secondary">{userData.name}</p>
                    <p className="text-xs text-slate-500">Open patient hub</p>
                  </div>
                  <svg className="mr-2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {showAccountMenu ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-64 rounded-[28px] border border-white/80 bg-white/95 p-3 shadow-soft">
                    <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                      <p className="text-sm font-semibold text-secondary">{userData.email}</p>
                      <p className="mt-1 text-xs text-slate-500">Everything from appointments to invoices lives here.</p>
                    </div>

                    <div className="mt-3 grid gap-1">
                      {careLinks.map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={() => setShowAccountMenu(false)}
                          className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-secondary"
                        >
                          {link.label}
                        </NavLink>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hidden items-center gap-3 sm:flex">
                <button onClick={() => navigate('/login')} className="app-button-secondary">
                  Sign in
                </button>
                <button onClick={() => navigate('/login')} className="app-button">
                  Create account
                </button>
              </div>
            )}

            <button
              onClick={() => setShowMenu(true)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-soft lg:hidden"
              aria-label="Open navigation"
            >
              <img src={assets.menu_icon} alt="" className="w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-[60] lg:hidden ${showMenu ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          onClick={() => setShowMenu(false)}
          className={`absolute inset-0 bg-secondary/40 backdrop-blur-sm transition ${showMenu ? 'opacity-100' : 'opacity-0'}`}
        />

        <div
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm bg-[linear-gradient(180deg,#f8fbfc_0%,#eef5f7_100%)] p-5 shadow-2xl transition duration-500 ${
            showMenu ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="glass-panel flex h-full flex-col p-5">
            <div className="flex items-center justify-between">
              <img src={assets.logo} alt="MediFlow" className="w-32" />
              <button
                onClick={() => setShowMenu(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm"
                aria-label="Close navigation"
              >
                <img src={assets.cross_icon} alt="" className="w-4" />
              </button>
            </div>

            {token && userData ? (
              <div className="mt-6 rounded-[24px] bg-white/85 p-4">
                <div className="flex items-center gap-3">
                  <img className="h-14 w-14 rounded-2xl object-cover" src={userData.image || assets.profile_pic} alt={userData.name} />
                  <div>
                    <p className="text-lg font-bold text-secondary">{userData.name}</p>
                    <p className="text-sm text-slate-500">{userData.email}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-2">
              {primaryLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setShowMenu(false)}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-sm font-semibold ${
                      isActive ? 'bg-secondary text-white' : 'bg-white/70 text-slate-600'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] bg-white/85 p-3">
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Care tools</p>
              <div className="mt-3 grid gap-2">
                <NavLink to="/smart-scheduler" onClick={() => setShowMenu(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Smart scheduler
                </NavLink>
                <NavLink to="/symptom-checker" onClick={() => setShowMenu(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Symptom checker
                </NavLink>
              </div>
            </div>

            {token && userData ? (
              <div className="mt-6 rounded-[24px] bg-white/85 p-3">
                <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Patient hub</p>
                <div className="mt-3 grid gap-2">
                  {careLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setShowMenu(false)}
                      className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-auto grid gap-3">
              {token ? (
                <button onClick={handleLogout} className="app-button-secondary w-full justify-center text-rose-600">
                  Log out
                </button>
              ) : (
                <>
                  <button onClick={() => { navigate('/login'); setShowMenu(false); }} className="app-button w-full justify-center">
                    Create account
                  </button>
                  <button onClick={() => { navigate('/login'); setShowMenu(false); }} className="app-button-secondary w-full justify-center">
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
