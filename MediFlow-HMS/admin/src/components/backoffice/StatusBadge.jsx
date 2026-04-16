import React from 'react';

const variants = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  danger: 'bg-rose-50 text-rose-700 ring-rose-100',
  info: 'bg-sky-50 text-sky-700 ring-sky-100',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const StatusBadge = ({ children, tone = 'neutral' }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${variants[tone] || variants.neutral}`}>
    {children}
  </span>
);

export default StatusBadge;
