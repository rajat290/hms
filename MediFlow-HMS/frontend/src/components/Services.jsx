import React from 'react';
import SectionHeading from './ui/SectionHeading';

const servicesList = [
  {
    title: 'Primary consultations',
    desc: 'General care, follow-up visits, and preventive reviews in a simple booking flow.',
  },
  {
    title: 'Specialist pathways',
    desc: 'Move from discovery to a specialist appointment without the typical admin friction.',
  },
  {
    title: 'Digital billing',
    desc: 'Track paid visits, pending dues, and downloadable invoices inside the patient portal.',
  },
  {
    title: 'Reminder automation',
    desc: 'Stay aligned with appointment reminders, confirmation states, and schedule changes.',
  },
];

const Services = () => (
  <section className="section-space">
    <div className="glass-panel px-6 py-8 sm:px-8">
      <SectionHeading
        eyebrow="Designed around the real journey"
        title="More than just booking screens."
        description="The frontend now supports the entire care loop: deciding where to start, choosing a doctor, confirming payment, and returning later without losing context."
      />

      <div className="mt-8 section-grid">
        {servicesList.map((service, index) => (
          <article key={service.title} className="app-card p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-white">
              0{index + 1}
            </div>
            <h3 className="mt-5 text-xl font-bold text-secondary">{service.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{service.desc}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Services;
