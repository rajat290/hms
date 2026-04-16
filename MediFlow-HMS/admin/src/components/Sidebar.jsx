import React from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';
import { navigationByRole, roleMeta } from '../utils/backofficeConfig';

const Sidebar = ({ role, isOpen, onClose }) => {
  const items = navigationByRole[role] || [];
  const roleDetails = roleMeta[role] || roleMeta.admin;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition lg:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      <aside
        className={`backoffice-main fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col border-r border-white/10 bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.26)] transition-transform duration-300 lg:z-20 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="border-b border-white/10 px-5 pb-6 pt-5">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white"
              aria-label="Close navigation"
            >
              X
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${roleDetails.accent} shadow-lg`}>
              <img src={assets.admin_logo} alt="" className="h-7 w-7 brightness-0 invert" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">{roleDetails.label}</p>
              <p className="text-xs leading-5 text-slate-400">{roleDetails.description}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Workspace
          </div>
          <nav className="space-y-1.5">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isActive ? 'bg-slate-950/6' : 'bg-white/6 group-hover:bg-white/10'}`}>
                      <img
                        src={item.icon}
                        alt=""
                        className={`h-5 w-5 ${isActive ? 'opacity-80 brightness-0' : 'opacity-80 brightness-0 invert'}`}
                      />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 px-5 py-5">
          <div className="rounded-[24px] bg-white/6 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Usability First</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Keep the everyday workflow simple, visible, and safe for non-technical teams.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
