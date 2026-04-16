import React from 'react';

const StatCard = ({ icon, label, value, hint, accent = 'from-teal-500 to-cyan-500', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative overflow-hidden rounded-[28px] border border-white/60 bg-white/88 p-5 text-left shadow-[0_22px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)] ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
      </div>
      {icon ? (
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} shadow-lg`}>
          <img src={icon} alt="" className="h-6 w-6 brightness-0 invert" />
        </div>
      ) : null}
    </div>
  </button>
);

export default StatCard;
