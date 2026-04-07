import React from 'react';
import { Link } from 'react-router-dom';
import { specialityData } from '../assets/assets';
import SectionHeading from './ui/SectionHeading';

const SpecialityMenu = () => (
  <section id="speciality" className="section-space">
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Browse by specialty"
        title="Start with the kind of care you need."
        description="Each specialty card takes patients straight into a filtered doctor list, so discovery feels faster and more focused."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {specialityData.map((item) => (
          <Link
            key={item.speciality}
            to={`/doctors/${item.speciality}`}
            className="app-card group flex items-center gap-5 p-5 card-hover"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10">
              <img src={item.image} alt={item.speciality} className="w-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-secondary">{item.speciality}</p>
              <p className="mt-1 text-sm text-slate-500">Explore relevant doctors and next available slots.</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default SpecialityMenu;
