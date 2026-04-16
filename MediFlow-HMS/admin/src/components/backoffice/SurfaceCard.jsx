import React from 'react';

const SurfaceCard = ({ children, className = '' }) => (
  <div
    className={`bo-surface p-6 ${className}`}
  >
    {children}
  </div>
);

export default SurfaceCard;
