import React from 'react';
import SurfaceCard from './SurfaceCard';

const EmptyState = ({ title, description, action }) => (
  <SurfaceCard className="flex min-h-[220px] items-center justify-center">
    <div className="max-w-md space-y-3 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <span className="text-xl">+</span>
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  </SurfaceCard>
);

export default EmptyState;
