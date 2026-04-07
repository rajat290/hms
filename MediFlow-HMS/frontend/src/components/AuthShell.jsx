import React from 'react';

const AuthShell = ({ eyebrow, title, description, children, asideTitle, asidePoints = [] }) => (
  <section className="section-space">
    <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
      <div className="rounded-[34px] bg-gradient-primary px-6 py-8 text-white shadow-2xl shadow-primary/20 sm:px-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">{description}</p>

        <div className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">{asideTitle}</p>
          <div className="mt-4 grid gap-3">
            {asidePoints.map((point) => (
              <div key={point.title} className="rounded-[20px] bg-white/10 px-4 py-4">
                <p className="text-lg font-bold">{point.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/75">{point.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel px-6 py-8 sm:px-8 sm:py-10">{children}</div>
    </div>
  </section>
);

export default AuthShell;
