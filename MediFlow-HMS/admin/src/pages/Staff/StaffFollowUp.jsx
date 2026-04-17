import React, { useContext, useMemo } from 'react';
import { StaffContext } from '../../context/StaffContext';
import { AppContext } from '../../context/AppContext';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import { getVisitStatusMeta, isVisitActive } from '../../utils/appointmentLifecycle';

const StaffFollowUp = () => {
  const { appointments } = useContext(StaffContext);
  const { slotDateFormat } = useContext(AppContext);

  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => isVisitActive(appointment)),
    [appointments],
  );

  const sendReminder = (phone, name, date, time) => {
    const message = `Hello ${name}, this is a reminder for your appointment at Mediflow on ${date} at ${time}. Please arrive 10 minutes early.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Follow-ups"
        title="Make reminders feel simple for the front desk."
        description="Staff can quickly reach active appointments without accidentally messaging cancelled or already completed visits."
      />

      <SurfaceCard className="space-y-4">
        {upcomingAppointments.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-slate-500">
            No upcoming appointments found.
          </div>
        ) : (
          upcomingAppointments.map((item) => {
            const visitStatusMeta = getVisitStatusMeta(item);

            return (
              <div key={item._id} className="grid gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 xl:grid-cols-[1.3fr_0.95fr_1.05fr_1fr] xl:items-center">
                <div className="flex items-center gap-3">
                  <img className="h-12 w-12 rounded-2xl object-cover" src={item.userData.image} alt="" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.userData.name}</p>
                      <StatusBadge tone={visitStatusMeta.tone}>{visitStatusMeta.label}</StatusBadge>
                    </div>
                    <p className="text-xs text-slate-500">Phone: {item.userData.phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="table-head">Date and time</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{slotDateFormat(item.slotDate)}</p>
                  <p className="text-xs text-slate-500">{item.slotTime}</p>
                </div>
                <div>
                  <p className="table-head">Doctor</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.docData.name}</p>
                </div>
                <div className="flex justify-start xl:justify-end">
                  <button
                    type="button"
                    onClick={() => sendReminder(item.userData.phone, item.userData.name, item.slotDate, item.slotTime)}
                    className="soft-button-accent px-4 py-2 text-xs"
                  >
                    Send reminder
                  </button>
                </div>
              </div>
            );
          })
        )}
      </SurfaceCard>
    </div>
  );
};

export default StaffFollowUp;
