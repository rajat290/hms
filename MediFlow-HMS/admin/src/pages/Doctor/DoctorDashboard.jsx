import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatCard from '../../components/backoffice/StatCard';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import {
  canAcceptAppointment,
  canCancelAppointment,
  canCompleteAppointment,
  canStartConsultation,
  getVisitStatusMeta,
} from '../../utils/appointmentLifecycle';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const {
    dToken,
    dashData,
    getDashData,
    cancelAppointment,
    acceptAppointment,
    startConsultation,
    completeAppointment,
  } = useContext(DoctorContext);
  const { slotDateFormat, currency } = useContext(AppContext);

  useEffect(() => {
    if (dToken) {
      getDashData();
    }
  }, [dToken]);

  if (!dashData) {
    return <LoadingState label="Preparing the doctor workspace..." />;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Doctor overview"
        title="A calmer daily workspace for consults, follow-ups, and outcomes."
        description="See what is waiting, what is already in progress, and what still needs a clinical action without reading between the lines."
        actions={(
          <>
            <button type="button" className="soft-button-secondary" onClick={() => navigate('/doctor-availability')}>
              Edit availability
            </button>
            <button type="button" className="soft-button-accent" onClick={() => navigate('/doctor-appointments')}>
              Open appointments
            </button>
          </>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <StatCard
          icon={assets.earning_icon}
          label="Earnings"
          value={`${currency}${dashData.earnings}`}
          hint="Captured through completed or paid visits"
          accent="from-teal-500 to-cyan-500"
        />
        <StatCard
          icon={assets.appointments_icon}
          label="Appointments"
          value={dashData.appointments}
          hint="Total assigned bookings"
          accent="from-sky-500 to-indigo-500"
        />
        <StatCard
          icon={assets.patients_icon}
          label="Patients"
          value={dashData.patients}
          hint="Unique patients treated"
          accent="from-amber-500 to-orange-500"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Action queue</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recent patient bookings</h2>
            </div>
            <button type="button" className="soft-button-secondary px-4 py-2" onClick={() => navigate('/doctor-appointments')}>
              View all
            </button>
          </div>

          <div className="space-y-3">
            {dashData.latestAppointments.slice(0, 6).map((item) => {
              const visitStatusMeta = getVisitStatusMeta(item);

              return (
                <div key={item._id} className="flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 md:flex-row md:items-center">
                  <img src={item.userData.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.userData.name}</p>
                      <StatusBadge tone={visitStatusMeta.tone}>{visitStatusMeta.label}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {slotDateFormat(item.slotDate)} | {item.slotTime}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{visitStatusMeta.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canAcceptAppointment(item) ? (
                      <button type="button" className="soft-button-accent px-4 py-2" onClick={() => acceptAppointment(item._id)}>
                        Confirm
                      </button>
                    ) : null}
                    {canStartConsultation(item) ? (
                      <button type="button" className="soft-button-accent px-4 py-2" onClick={() => startConsultation(item._id)}>
                        Start consult
                      </button>
                    ) : null}
                    {canCompleteAppointment(item) ? (
                      <button type="button" className="soft-button-accent px-4 py-2" onClick={() => completeAppointment(item._id)}>
                        Complete visit
                      </button>
                    ) : null}
                    {canCancelAppointment(item) ? (
                      <button type="button" className="soft-button-secondary px-4 py-2" onClick={() => cancelAppointment(item._id)}>
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Today's guidance</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Stay ahead of the session</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Clinical flow</p>
              <p className="mt-3 text-lg font-semibold">Confirm first, begin the consult only when the patient is actually ready.</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">That keeps completion, notes, prescriptions, and billing aligned with what happened in the room.</p>
            </div>

            <div className="rounded-[24px] border border-sky-100 bg-sky-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">Profile hygiene</p>
              <p className="mt-3 text-sm leading-6 text-sky-900">
                Review your profile and availability before the next booking cycle so patients always see accurate consultation details.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button type="button" className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/doctor-profile')}>
                <p className="text-sm font-semibold text-slate-900">Update profile</p>
                <p className="mt-1 text-sm text-slate-500">Fees, address, about, and consultation details.</p>
              </button>
              <button type="button" className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/doctor-availability')}>
                <p className="text-sm font-semibold text-slate-900">Set availability</p>
                <p className="mt-1 text-sm text-slate-500">Keep slots aligned with your real-world schedule.</p>
              </button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
};

export default DoctorDashboard;
