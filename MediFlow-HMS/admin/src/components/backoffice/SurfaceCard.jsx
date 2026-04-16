import React from 'react';

const SurfaceCard = ({ children, className = '' }) => (
  <div
    className={`rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur ${className}`}
  >
    {children}
  </div>
);

export default SurfaceCard;
