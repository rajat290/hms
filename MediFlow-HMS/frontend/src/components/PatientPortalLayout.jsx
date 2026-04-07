import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';

const links = [
  { to: '/my-profile', label: 'Profile' },
  { to: '/my-appointments', label: 'Appointments' },
  { to: '/my-billing', label: 'Billing' },
  { to: '/notifications', label: 'Notifications' },
];

const PatientPortalLayout = ({ title, description, actions, stats = [], children }) => {
  const { userData } = useContext(AppContext);

  return (
    <section className="section-space">
      <div className="grid gap-6 xl:grid-cols-[300px,minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <div className="glass-panel overflow-hidden p-6">
            <div className="flex items-center gap-4">
              <img
                src={userData?.image || assets.profile_pic}
                alt={userData?.name || 'Patient'}
                className="h-16 w-16 rounded-2xl border border-white/70 object-cover shadow-lg"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Patient hub</p>
                <h2 className="mt-1 text-xl font-bold text-secondary">{userData?.name || 'Your account'}</h2>
                <p className="text-sm text-slate-500">{userData?.email || 'Manage your upcoming care and records.'}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-secondary text-white shadow-lg shadow-secondary/10'
                        : 'bg-white/70 text-slate-600 hover:bg-white'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  <span className="text-xs uppercase tracking-[0.16em] opacity-70">Open</span>
                </NavLink>
              ))}
            </div>
          </div>

          {stats.length > 0 ? (
            <div className="app-card grid gap-3 p-5">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-secondary">{stat.value}</p>
                  {stat.helper ? <p className="mt-1 text-sm text-slate-500">{stat.helper}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="space-y-6">
          <div className="glass-panel px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="eyebrow">Care account</p>
                <h1 className="font-display text-4xl text-secondary sm:text-5xl">{title}</h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
          </div>

          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </section>
  );
};

export default PatientPortalLayout;
