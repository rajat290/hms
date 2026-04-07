import React from 'react';
import { assets } from '../assets/assets';
import PageHero from '../components/ui/PageHero';
import SectionHeading from '../components/ui/SectionHeading';

const values = [
  {
    title: 'Make care feel calmer',
    copy: 'Reduce friction across discovery, booking, reminders, and return visits so patients do not feel lost between screens.',
  },
  {
    title: 'Keep trust visible',
    copy: 'Reliable hierarchy, real statuses, and clearer patient context make the interface feel more mature and credible.',
  },
  {
    title: 'Support the whole journey',
    copy: 'This is not just a landing page plus a form. The portal helps patients before, during, and after a consultation.',
  },
];

const About = () => (
  <div className="section-space space-y-8">
    <PageHero
      eyebrow="About MediFlow"
      title="Modern hospital interactions should feel reassuring, not exhausting."
      description="MediFlow combines doctor discovery, appointment management, payment visibility, and digital patient utilities into a single experience that feels much closer to a real healthcare product."
      aside={
        <div className="app-card overflow-hidden">
          <img src={assets.about_image} alt="About MediFlow" className="h-full max-h-[420px] w-full object-cover" />
        </div>
      }
    />

    <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
      <div className="glass-panel px-6 py-8 sm:px-8">
        <SectionHeading
          eyebrow="Why this matters"
          title="Patients remember how the flow felt, not just whether it technically worked."
          description="That is why the redesign focuses on stronger hierarchy, cleaner state feedback, and consistent information density across public pages and the patient portal."
        />
      </div>

      <div className="grid gap-4">
        {values.map((value) => (
          <article key={value.title} className="app-card p-6">
            <h3 className="text-2xl font-bold text-secondary">{value.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{value.copy}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="app-card px-6 py-8 sm:px-8">
      <SectionHeading
        eyebrow="Product vision"
        title="Healthcare software should feel clear under pressure."
        description="The patient-facing frontend has been restructured to feel more like a modern real-world app: cleaner public discovery, a more intentional booking flow, stronger portal navigation, better loading states, and improved responsiveness throughout."
      />
    </section>
  </div>
);

export default About;
