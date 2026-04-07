import React from 'react';

const LoadingState = ({ title = 'Loading', message = 'Preparing your experience...', fullHeight = false }) => (
  <div className={`flex w-full items-center justify-center ${fullHeight ? 'min-h-[70vh]' : 'min-h-[320px]'}`}>
    <div className="glass-panel max-w-md px-8 py-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <div className="loader-orbit h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
      <h3 className="mt-6 text-2xl font-bold text-secondary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
      <div className="mt-6 grid gap-3">
        <div className="skeleton-line h-3 w-full rounded-full" />
        <div className="skeleton-line h-3 w-5/6 rounded-full" />
        <div className="skeleton-line h-3 w-2/3 rounded-full" />
      </div>
    </div>
  </div>
);

export default LoadingState;
