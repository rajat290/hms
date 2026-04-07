import React from 'react';

const EmptyState = ({ title, description, action }) => (
  <div className="app-card flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
      </svg>
    </div>
    <h3 className="mt-5 text-2xl font-bold text-secondary">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);

export default EmptyState;
