import React, { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';
import { AppContext } from '../context/AppContext';
import { getPageMeta, roleMeta } from '../utils/backofficeConfig';

const Navbar = ({ role, onOpenSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, notifications, markAsRead } = useContext(NotificationContext);
  const { isDarkMode, setIsDarkMode, isEmergencyMode, setIsEmergencyMode, logoutCurrentSession } = useContext(AppContext);
  const [showNotifications, setShowNotifications] = useState(false);

  const pageMeta = useMemo(() => getPageMeta(location.pathname, role), [location.pathname, role]);
  const roleDetails = roleMeta[role] || roleMeta.admin;

  const handleLogout = async () => {
    await logoutCurrentSession();
    navigate('/');
  };

  return (
    <header className="bo-navbar backoffice-main sticky top-0 z-30 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm lg:hidden"
              aria-label="Open navigation"
            >
              <span className="text-lg">=</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white shadow ${roleDetails.accent}`}>
                  {roleDetails.shortLabel}
                </span>
                <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-500">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="mt-2">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {pageMeta.title}
                </h1>
                {pageMeta.description ? (
                  <p className="text-sm text-slate-500">{pageMeta.description}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="soft-button-secondary rounded-2xl px-4 py-3 text-xs uppercase tracking-[0.18em]"
            >
              {isDarkMode ? 'Light mode' : 'Dark mode'}
            </button>

            {role === 'staff' ? (
              <button
                type="button"
                onClick={() => setIsEmergencyMode(!isEmergencyMode)}
                className={`hidden rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] shadow-sm transition sm:inline-flex ${
                  isEmergencyMode
                    ? 'bg-rose-600 text-white shadow-rose-600/30'
                    : 'border border-slate-200 bg-white/85 text-slate-600 hover:border-rose-200 hover:text-rose-600'
                }`}
              >
                {isEmergencyMode ? 'Emergency Active' : 'Normal Mode'}
              </button>
            ) : null}

            {role === 'staff' ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm"
                  aria-label="View notifications"
                >
                  <span className="text-lg">!</span>
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                {showNotifications ? (
                  <div className="bo-surface absolute right-0 top-14 w-[320px] p-3">
                    <div className="mb-3 flex items-center justify-between px-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Staff alerts</p>
                        <p className="text-xs text-slate-500">Latest desk and queue activity.</p>
                      </div>
                    </div>
                    <div className="max-h-[320px] space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                          No new notifications right now.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <button
                            type="button"
                            key={item._id}
                            onClick={() => markAsRead(item._id)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                              item.read
                                ? 'border-slate-100 bg-slate-50/80'
                                : 'border-teal-100 bg-teal-50/80'
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="soft-button-primary rounded-2xl px-4 py-3 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
