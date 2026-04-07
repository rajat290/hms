import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import SpecialityMenu from '../components/SpecialityMenu';
import Services from '../components/Services';
import TopDoctors from '../components/TopDoctors';
import Stats from '../components/Stats';
import Banner from '../components/Banner';
import FAQ from '../components/FAQ';

const Home = () => (
  <div className="section-space space-y-2">
    <Header />
    <SpecialityMenu />
    <Services />

    <section className="section-space">
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="app-card px-6 py-8 sm:px-8">
          <p className="eyebrow">Patient tools</p>
          <h2 className="mt-4 font-display text-3xl text-secondary sm:text-4xl">Useful between visits, not just during booking.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            The frontend now treats the patient portal as a product in its own right. Patients can use AI-assisted scheduling and symptom support without the experience feeling bolted on.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/smart-scheduler" className="app-button">
              Open smart scheduler
            </Link>
            <Link to="/symptom-checker" className="app-button-secondary">
              Try symptom checker
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: 'AI scheduler',
              title: 'Find a better slot with less manual back-and-forth.',
              tone: 'bg-secondary text-white',
            },
            {
              label: 'Symptom support',
              title: 'Guide patients toward the right type of consultation earlier.',
              tone: 'bg-primary/10 text-primary',
            },
            {
              label: 'Billing clarity',
              title: 'Appointments, invoices, and payment status now feel connected.',
              tone: 'bg-white text-secondary',
            },
            {
              label: 'Responsive portal',
              title: 'Mobile usage no longer feels like a second-class experience.',
              tone: 'bg-accent/15 text-secondary',
            },
          ].map((item) => (
            <article key={item.label} className={`app-card px-5 py-5 ${item.tone}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{item.label}</p>
              <p className="mt-3 text-lg font-bold leading-7">{item.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <TopDoctors />
    <Stats />
    <Banner />
    <FAQ />
  </div>
);

export default Home;
