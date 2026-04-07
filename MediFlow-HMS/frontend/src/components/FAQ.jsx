import React, { useState } from 'react';
import SectionHeading from './ui/SectionHeading';

const faqs = [
  {
    q: 'How quickly can I book an appointment?',
    a: 'Most patients can search, choose a doctor, and secure a slot in under two minutes on mobile or desktop.',
  },
  {
    q: 'Can I reschedule from the portal?',
    a: 'Yes. Upcoming appointments now surface reschedule actions more clearly, with refreshed slot selection and status feedback.',
  },
  {
    q: 'Where do payments and invoices live?',
    a: 'Paid visits, pending dues, and invoice downloads live inside the billing area of the patient portal.',
  },
  {
    q: 'Is this only for online payments?',
    a: 'No. Patients can complete bookings for supported payment methods and still keep the appointment history in one place.',
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section-space">
      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="glass-panel px-6 py-8 sm:px-8">
          <SectionHeading
            eyebrow="Common patient questions"
            title="A calmer experience should also be easier to understand."
            description="The FAQ block is now clearer, more spacious, and better aligned with the tone of the rest of the product."
          />
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const open = openIndex === index;

            return (
              <article key={faq.q} className="app-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-lg font-bold text-secondary">{faq.q}</span>
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-secondary transition ${open ? 'rotate-45 bg-secondary text-white' : 'bg-white'}`}>
                    +
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-7 text-slate-500">{faq.a}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
