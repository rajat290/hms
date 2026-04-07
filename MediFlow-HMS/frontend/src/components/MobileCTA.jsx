import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const links = [
  { key: 'find', label: 'Find care', path: '/doctors' },
  { key: 'portal', label: 'My portal', path: '/my-appointments' },
  { key: 'support', label: 'Support', path: '/contact' },
];

const MobileCTA = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (['/login', '/reset-password', '/verify', '/verify-email'].some((route) => location.pathname.startsWith(route))) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:hidden">
      <div className="glass-panel flex items-center justify-between rounded-[26px] px-3 py-3">
        {links.map((link) => {
          const active = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);

          return (
            <button
              key={link.key}
              onClick={() => navigate(link.path)}
              className={`flex min-w-[92px] flex-1 items-center justify-center rounded-[20px] px-3 py-3 text-sm font-semibold ${
                active ? 'bg-secondary text-white shadow-lg shadow-secondary/10' : 'text-slate-500'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileCTA;
