import React from 'react';

const SectionHeading = ({ eyebrow, title, description, align = 'left' }) => (
  <div className={`space-y-3 ${align === 'center' ? 'mx-auto max-w-3xl text-center' : ''}`}>
    {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
    <h2 className="font-display text-3xl text-secondary sm:text-4xl">{title}</h2>
    {description ? <p className="text-sm leading-7 text-slate-600 sm:text-base">{description}</p> : null}
  </div>
);

export default SectionHeading;
