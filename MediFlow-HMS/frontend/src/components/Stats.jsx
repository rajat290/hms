import React from 'react';

const stats = [
  { label: 'Appointments managed', value: '12k+', helper: 'Across bookings, reschedules, and completed visits' },
  { label: 'Average response time', value: '< 5 min', helper: 'For digital confirmations and scheduling updates' },
  { label: 'Doctors onboarded', value: '100+', helper: 'Across high-demand specialties' },
  { label: 'Portal return rate', value: '68%', helper: 'Patients actively using the digital account area' },
];

const Stats = () => (
  <section className="section-space">
    <div className="rounded-[36px] bg-gradient-primary px-6 py-10 text-white shadow-2xl shadow-primary/20 sm:px-8">
      <div className="space-y-3">
        <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
          Operational trust
        </p>
        <h2 className="font-display text-3xl sm:text-4xl">Built to feel dependable, not improvised.</h2>
        <p className="max-w-3xl text-sm leading-7 text-white/80 sm:text-base">
          The redesign leans into credibility with a stronger layout rhythm, clearer states, and more confident information architecture.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[28px] border border-white/15 bg-white/10 px-5 py-6 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{stat.label}</p>
            <p className="mt-3 text-4xl font-extrabold">{stat.value}</p>
            <p className="mt-3 text-sm leading-6 text-white/75">{stat.helper}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Stats;
