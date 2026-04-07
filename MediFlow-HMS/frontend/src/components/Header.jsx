import React from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';
import PageHero from './ui/PageHero';

const Header = () => (
  <PageHero
    eyebrow="Patient-first digital care"
    title="A hospital experience that feels calm, fast, and dependable."
    description="Find the right specialist, lock in a consultation, manage records, and stay ahead of follow-ups through a polished patient portal that works beautifully on every screen."
    actions={
      <>
        <Link to="/doctors" className="app-button">
          Book an appointment
        </Link>
        <a href="tel:+12124567890" className="app-button-secondary">
          Call the care desk
        </a>
      </>
    }
    stats={[
      { label: 'Average booking time', value: '2 min', helper: 'From search to confirmation' },
      { label: 'Patient satisfaction', value: '4.9/5', helper: 'Across repeat visitors' },
      { label: 'Live specialties', value: '18+', helper: 'From primary care to diagnostics' },
    ]}
    aside={
      <div className="float-card app-card overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-primary px-6 pb-0 pt-6 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Today in care</p>
              <p className="mt-2 text-2xl font-bold">Same-day appointments available</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
              <p className="font-semibold">24x7 support</p>
              <p className="text-white/75">Human help when needed</p>
            </div>
          </div>
          <img src={assets.header_img} alt="Doctor" className="mt-6 w-full object-contain" />
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="rounded-[22px] bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">What patients use most</p>
            <p className="mt-2 text-lg font-bold text-secondary">Booking, invoices, reminders, and AI guidance.</p>
          </div>
          <div className="rounded-[22px] bg-primary/10 px-4 py-4 text-primary">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">Portal highlight</p>
            <p className="mt-2 text-lg font-bold">Billing and appointment history stay in sync.</p>
          </div>
        </div>
      </div>
    }
  />
);

export default Header;
