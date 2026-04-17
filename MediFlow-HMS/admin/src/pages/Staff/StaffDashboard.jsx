import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { StaffContext } from '../../context/StaffContext';
import { AppContext } from '../../context/AppContext';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatCard from '../../components/backoffice/StatCard';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import { canCancelAppointment, canCheckInAppointment, getVisitStatusMeta } from '../../utils/appointmentLifecycle';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { sToken, getDashData, cancelAppointment, checkInAppointment, dashData } = useContext(StaffContext);
  const { slotDateFormat, isEmergencyMode } = useContext(AppContext);

  useEffect(() => {
    if (sToken) {
      getDashData();
    }
  }, [sToken]);

  if (!dashData) {
    return <LoadingState label="Preparing the staff desk..." />;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Front desk overview"
        title="Help the team move faster without forcing them to learn software tricks."
        description="Today's volume, arrivals, collections, and next actions stay visible up front so staff can operate confidently with minimal training."
        actions={(
          <>
            <button type="button" className="soft-button-secondary" onClick={() => navigate('/staff-patients')}>
              Find patient
            </button>
            <button type="button" className="soft-button-accent" onClick={() => navigate('/staff-add-patient')}>
              Register patient
            </button>
          </>
        )}
      />

      {isEmergencyMode ? (
        <SurfaceCard className="border-rose-200 bg-rose-50/90">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">Emergency mode</p>
              <h2 className="mt-2 text-2xl font-semibold text-rose-950">Critical patients should be prioritized immediately.</h2>
              <p className="mt-1 text-sm text-rose-800/80">Use the queue to move urgent arrivals to the top and keep billing secondary until the rush settles.</p>
            </div>
            <button type="button" className="soft-button-primary" onClick={() => navigate('/staff-queue')}>
              Open queue
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard icon={assets.appointments_icon} label="Appointments" value={dashData.appointments} hint="Total scheduled visits" accent="from-sky-500 to-indigo-500" />
        <StatCard icon={assets.patients_icon} label="Patients" value={dashData.patients} hint="Registered patient records" accent="from-teal-500 to-emerald-500" />
        <StatCard icon={assets.doctor_icon} label="Doctors" value={dashData.doctors} hint="Available doctor roster" accent="from-amber-500 to-orange-500" />
        <StatCard icon={assets.earning_icon} label="Collections" value={`INR ${dashData.totalCollections || 0}`} hint="Today's captured collections" accent="from-rose-500 to-pink-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.1fr]">
        <SurfaceCard className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Quick actions</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Jump straight into the common desk tasks</h2>
          </div>

          <div className="grid gap-4">
            <button type="button" className="rounded-[26px] bg-gradient-to-br from-teal-600 to-cyan-500 p-5 text-left text-white shadow-[0_20px_60px_rgba(13,148,136,0.24)] transition hover:-translate-y-0.5" onClick={() => navigate('/staff-add-patient')}>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-50">Register</p>
              <p className="mt-2 text-xl font-semibold">Create a new patient profile</p>
              <p className="mt-2 text-sm text-teal-50/90">Capture contact, identity, and emergency details in one go.</p>
            </button>

            <div className="grid gap-4 sm:grid-cols-2">
              <button type="button" className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/staff-appointments')}>
                <p className="text-sm font-semibold text-slate-900">Appointments</p>
                <p className="mt-1 text-sm text-slate-500">Check in patients, cancel safely, and move bookings forward.</p>
              </button>
              <button type="button" className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/staff-billing')}>
                <p className="text-sm font-semibold text-slate-900">Billing</p>
                <p className="mt-1 text-sm text-slate-500">Turn visits into invoices and record payment safely.</p>
              </button>
              <button type="button" className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/staff-patients')}>
                <p className="text-sm font-semibold text-slate-900">Patient records</p>
                <p className="mt-1 text-sm text-slate-500">Search records and jump into service actions fast.</p>
              </button>
              <button type="button" className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/staff-queue')}>
                <p className="text-sm font-semibold text-slate-900">Queue</p>
                <p className="mt-1 text-sm text-slate-500">Keep everyone aligned on who needs attention next.</p>
              </button>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Recent activity</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Latest bookings</h2>
            </div>
            <button type="button" className="soft-button-secondary px-4 py-2" onClick={() => navigate('/staff-appointments')}>
              View all
            </button>
          </div>

          <div className="space-y-3">
            {dashData.latestAppointments.slice(0, 6).map((item) => {
              const visitStatusMeta = getVisitStatusMeta(item);

              return (
                <div key={item._id} className="flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 md:flex-row md:items-center">
                  <img src={item.docData.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.userData?.name || item.docData.name}</p>
                      <StatusBadge tone={visitStatusMeta.tone}>{visitStatusMeta.label}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.docData.name} | {slotDateFormat(item.slotDate)} | {item.slotTime}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{visitStatusMeta.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canCheckInAppointment(item) ? (
                      <button type="button" className="soft-button-accent px-4 py-2" onClick={() => checkInAppointment(item._id)}>
                        Check in
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
      </div>
    </div>
  );
};

export default StaffDashboard;
