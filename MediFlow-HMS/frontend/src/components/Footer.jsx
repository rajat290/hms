import React from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const Footer = () => (
  <footer className="relative z-10 mt-12 pb-28 pt-10 sm:pb-10">
    <div className="page-wrap">
      <div className="glass-panel overflow-hidden px-6 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr,0.8fr,0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex rounded-2xl bg-white p-3 shadow-soft">
              <img src={assets.logo} alt="MediFlow" className="w-32" />
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-600">
              MediFlow turns hospital interactions into a calmer digital experience, from discovery and booking to invoices, reminders, and follow-up care.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="app-chip">Same-day bookings</span>
              <span className="app-chip">Secure patient portal</span>
              <span className="app-chip">Automated reminders</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary">Explore</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <Link to="/" className="hover:text-primary">Home</Link>
              <Link to="/doctors" className="hover:text-primary">Doctors</Link>
              <Link to="/about" className="hover:text-primary">About</Link>
              <Link to="/contact" className="hover:text-primary">Contact</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary">Patient Tools</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <Link to="/my-appointments" className="hover:text-primary">Appointments</Link>
              <Link to="/my-billing" className="hover:text-primary">Billing</Link>
              <Link to="/smart-scheduler" className="hover:text-primary">Smart scheduler</Link>
              <Link to="/symptom-checker" className="hover:text-primary">Symptom checker</Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary">Support</p>
            <div className="rounded-[24px] bg-white/90 p-5">
              <p className="text-sm font-semibold text-secondary">24x7 patient desk</p>
              <a href="tel:+12124567890" className="mt-2 block text-lg font-bold text-primary">+1 212 456 7890</a>
              <a href="mailto:care@mediflow.com" className="mt-1 block text-sm text-slate-600">care@mediflow.com</a>
              <p className="mt-4 text-sm leading-6 text-slate-500">Response team for urgent assistance, appointment updates, and billing help.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/80 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 MediFlow. Built for modern patient journeys.</p>
          <div className="flex flex-wrap gap-4">
            <span>Privacy-first experience</span>
            <span>Responsive across devices</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
