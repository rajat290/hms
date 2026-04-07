import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const DoctorCard = ({ doctor, currencySymbol = '\u20B9', compact = false }) => {
  const navigate = useNavigate();
  const available = doctor?.available !== false;

  return (
    <article
      onClick={() => {
        navigate(`/appointment/${doctor._id}`);
        window.scrollTo(0, 0);
      }}
      className="doctor-card app-card group cursor-pointer overflow-hidden"
    >
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#dff5f3_0%,#eff6ff_100%)]">
        <img
          className={`w-full object-cover transition duration-700 group-hover:scale-105 ${compact ? 'h-56' : 'h-64'}`}
          src={doctor.image}
          alt={doctor.name}
        />
        <div className="absolute left-4 top-4">
          <StatusBadge tone={available ? 'success' : 'neutral'}>
            {available ? 'Open for booking' : 'Currently unavailable'}
          </StatusBadge>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-secondary">{doctor.name}</h3>
              <p className="text-sm font-medium text-primary">{doctor.speciality}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Consultation</p>
              <p className="text-lg font-bold text-secondary">
                {currencySymbol}
                {doctor.fees}
              </p>
            </div>
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-slate-500">
            {doctor.about || 'Evidence-led care with clear communication, responsive follow-up, and thoughtful treatment planning.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="app-chip">{doctor.degree || 'MBBS'}</span>
          <span className="app-chip">{doctor.experience || 'Experienced specialist'}</span>
          {doctor.languages ? <span className="app-chip">{doctor.languages}</span> : null}
        </div>

        <button className="app-button w-full justify-center">
          View profile and book
        </button>
      </div>
    </article>
  );
};

export default DoctorCard;
