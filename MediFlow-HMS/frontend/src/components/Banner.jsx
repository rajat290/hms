import React from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const Banner = () => (
  <section className="section-space">
    <div className="app-card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-5 px-6 py-8 sm:px-8 sm:py-10">
          <p className="eyebrow">Ready to start</p>
          <h2 className="font-display text-3xl text-secondary sm:text-4xl">
            Create your patient account and keep the full journey in one place.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Book appointments, revisit invoices, track reminders, update your profile, and return without losing your place. The portal now feels like a real product, not a loose collection of forms.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="app-button">
              Create account
            </Link>
            <Link to="/my-appointments" className="app-button-secondary">
              Open patient portal
            </Link>
          </div>
        </div>

        <div className="bg-[linear-gradient(135deg,#10233F_0%,#0F766E_100%)] px-6 pt-8">
          <img src={assets.appointment_img} alt="Appointment" className="mx-auto max-h-[360px] object-contain" />
        </div>
      </div>
    </div>
  </section>
);

export default Banner;
