import React from 'react';
import SurfaceCard from './SurfaceCard';

const LoadingState = ({ label = 'Loading workspace...' }) => (
  <SurfaceCard className="flex min-h-[260px] items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-100 border-t-teal-500" />
      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-800">{label}</p>
        <p className="text-sm text-slate-500">Please wait while we prepare the latest data.</p>
      </div>
    </div>
  </SurfaceCard>
);

export default LoadingState;
