import React from 'react';

const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="space-y-2">
      {eyebrow && (
        <span className="bo-eyebrow inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] shadow-sm backdrop-blur">
          {eyebrow}
        </span>
      )}
      <div className="space-y-1">
        <h1 className="bo-title text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="bo-copy max-w-3xl text-sm leading-6 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </div>
);

export default PageHeader;
