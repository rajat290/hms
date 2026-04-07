import React from 'react';

const PageHero = ({
  eyebrow,
  title,
  description,
  actions,
  stats = [],
  aside,
  className = '',
}) => (
  <section className={`glass-panel relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-10 ${className}`}>
    <div className="hero-mesh pointer-events-none absolute inset-0 opacity-80" />
    <div className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
    <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />

    <div className={`relative z-10 grid gap-8 lg:items-center ${aside ? 'lg:grid-cols-[minmax(0,1.2fr),minmax(280px,0.8fr)]' : ''}`}>
      <div className="space-y-6">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <div className="space-y-4">
          <h1 className="font-display text-4xl leading-tight text-secondary sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p> : null}
        </div>

        {actions ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}

        {stats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="app-muted-card px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-extrabold text-secondary sm:text-3xl">{stat.value}</p>
                {stat.helper ? <p className="mt-1 text-sm text-slate-500">{stat.helper}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {aside ? <div className="relative z-10">{aside}</div> : null}
    </div>
  </section>
);

export default PageHero;
