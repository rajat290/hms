import React from 'react';
import PageHero from '../components/ui/PageHero';

const contactCards = [
  {
    label: 'Patient support',
    value: '+1 212 456 7890',
    helper: 'Live help for bookings, changes, and urgent portal questions.',
    href: 'tel:+12124567890',
  },
  {
    label: 'Email',
    value: 'care@mediflow.com',
    helper: 'For documentation, billing queries, and follow-up assistance.',
    href: 'mailto:care@mediflow.com',
  },
  {
    label: 'Main office',
    value: '54709 Willms Station, Suite 350, Washington, USA',
    helper: 'Mon to Sat, 8 AM to 8 PM',
  },
];

const Contact = () => (
  <div className="section-space space-y-8">
    <PageHero
      eyebrow="Contact and support"
      title="Help should be easy to reach when healthcare is involved."
      description="The support area now matches the rest of the product with clearer contact priorities, stronger spacing, and a more trustworthy presentation."
      actions={
        <>
          <a href="tel:+12124567890" className="app-button">
            Call patient support
          </a>
          <a href="mailto:care@mediflow.com" className="app-button-secondary">
            Email the team
          </a>
        </>
      }
      aside={
        <div className="app-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Support promise</p>
          <p className="mt-4 text-2xl font-bold text-secondary">Fast answers for appointment, billing, and account questions.</p>
          <p className="mt-3 text-sm leading-7 text-slate-500">Patients should never have to search three different screens to figure out how to get help.</p>
        </div>
      }
    />

    <section className="grid gap-4 md:grid-cols-3">
      {contactCards.map((card) => (
        <article key={card.label} className="app-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
          {card.href ? (
            <a href={card.href} className="mt-4 block text-2xl font-bold text-primary">
              {card.value}
            </a>
          ) : (
            <p className="mt-4 text-2xl font-bold text-secondary">{card.value}</p>
          )}
          <p className="mt-3 text-sm leading-7 text-slate-500">{card.helper}</p>
        </article>
      ))}
    </section>

    <section className="glass-panel overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="bg-gradient-primary px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Visit our office</p>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">A cleaner support experience should extend offline too.</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
            Whether patients arrive through the portal or the front desk, the brand should feel consistent, credible, and easy to trust.
          </p>
        </div>

        <div className="flex min-h-[320px] items-center justify-center bg-[linear-gradient(135deg,#eff6ff_0%,#dff5f3_100%)] p-6">
          <div className="app-card w-full max-w-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Office hours</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>Monday to Friday</span>
                <span className="font-semibold text-secondary">8:00 AM to 8:00 PM</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>Saturday</span>
                <span className="font-semibold text-secondary">9:00 AM to 5:00 PM</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>Emergency line</span>
                <span className="font-semibold text-secondary">Available 24x7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default Contact;
