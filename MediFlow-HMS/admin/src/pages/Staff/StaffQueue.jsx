import React, { useContext, useEffect, useMemo } from 'react';
import { StaffContext } from '../../context/StaffContext';
import { AppContext } from '../../context/AppContext';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import { canCheckInAppointment, getVisitStatus, getVisitStatusMeta, VISIT_STATUS } from '../../utils/appointmentLifecycle';

const StaffQueue = () => {
  const { appointments, getAllAppointments, sToken, checkInAppointment } = useContext(StaffContext);
  const { slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (sToken) {
      getAllAppointments();
    }
  }, [sToken]);

  const queue = useMemo(() => {
    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '_');

    return appointments
      .filter((appointment) => {
        const visitStatus = getVisitStatus(appointment);
        return appointment.slotDate === today && [
          VISIT_STATUS.REQUESTED,
          VISIT_STATUS.ACCEPTED,
          VISIT_STATUS.CHECKED_IN,
        ].includes(visitStatus);
      })
      .sort((left, right) => {
        const leftStatus = getVisitStatus(left);
        const rightStatus = getVisitStatus(right);

        if (leftStatus === VISIT_STATUS.CHECKED_IN && rightStatus !== VISIT_STATUS.CHECKED_IN) return -1;
        if (leftStatus !== VISIT_STATUS.CHECKED_IN && rightStatus === VISIT_STATUS.CHECKED_IN) return 1;
        return left.slotTime.localeCompare(right.slotTime);
      });
  }, [appointments]);

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Live queue"
        title="Keep today's arrivals visible in one simple queue."
        description="Front desk staff can see who is still scheduled, who has arrived, and who is ready for the doctor without scanning a full appointments table."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Today's queue</p>
          <p className="mt-3 text-4xl font-semibold text-slate-950">{queue.length}</p>
          <p className="mt-2 text-sm text-slate-500">Bookings still active for today</p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Ready now</p>
          <p className="mt-3 text-4xl font-semibold text-emerald-700">
            {queue.filter((appointment) => getVisitStatus(appointment) === VISIT_STATUS.CHECKED_IN).length}
          </p>
          <p className="mt-2 text-sm text-slate-500">Patients already checked in</p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Still waiting</p>
          <p className="mt-3 text-4xl font-semibold text-amber-700">
            {queue.filter((appointment) => getVisitStatus(appointment) !== VISIT_STATUS.CHECKED_IN).length}
          </p>
          <p className="mt-2 text-sm text-slate-500">Patients who have not arrived yet</p>
        </SurfaceCard>
      </div>

      <SurfaceCard className="space-y-4">
        {queue.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-slate-500">
            No patients are in today's queue.
          </div>
        ) : (
          queue.map((item, index) => {
            const visitStatusMeta = getVisitStatusMeta(item);

            return (
              <div key={item._id} className="grid gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 xl:grid-cols-[0.35fr_1.25fr_0.95fr_0.8fr_0.95fr_0.9fr] xl:items-center">
                <div className="text-sm font-semibold text-slate-400">{index + 1}</div>
                <div className="flex items-center gap-3">
                  <img src={item.userData.image} className="h-12 w-12 rounded-2xl object-cover" alt="" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.userData.name}</p>
                    <p className="text-xs text-slate-500">ID {item._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <div>
                  <p className="table-head">Doctor</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.docData.name}</p>
                </div>
                <div>
                  <p className="table-head">Time</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.slotTime}</p>
                  <p className="text-xs text-slate-500">{slotDateFormat(item.slotDate)}</p>
                </div>
                <div>
                  <p className="table-head">State</p>
                  <div className="mt-2">
                    <StatusBadge tone={visitStatusMeta.tone}>{visitStatusMeta.label}</StatusBadge>
                  </div>
                </div>
                <div className="flex justify-start xl:justify-end">
                  {canCheckInAppointment(item) ? (
                    <button
                      type="button"
                      onClick={() => checkInAppointment(item._id)}
                      className="soft-button-accent px-4 py-2 text-xs"
                    >
                      Check in
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-400"
                    >
                      Ready for doctor
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </SurfaceCard>
    </div>
  );
};

export default StaffQueue;
