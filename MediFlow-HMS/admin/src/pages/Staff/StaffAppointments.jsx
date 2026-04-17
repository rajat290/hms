import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffContext } from '../../context/StaffContext';
import { AppContext } from '../../context/AppContext';
import EmptyState from '../../components/backoffice/EmptyState';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import {
  canCancelAppointment,
  canCheckInAppointment,
  getVisitStatus,
  getVisitStatusMeta,
  isVisitActionableForBilling,
} from '../../utils/appointmentLifecycle';

const StaffAppointments = () => {
  const navigate = useNavigate();
  const { sToken, appointments, cancelAppointment, getAllAppointments, checkInAppointment } = useContext(StaffContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (sToken) {
      getAllAppointments();
    }
  }, [sToken]);

  const doctorNames = useMemo(
    () => Array.from(new Set(appointments.map((appointment) => appointment.docData.name))),
    [appointments],
  );

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const term = searchTerm.toLowerCase();
        const visitStatus = getVisitStatus(appointment);
        const matchesSearch =
          appointment.userData.name.toLowerCase().includes(term)
          || appointment.docData.name.toLowerCase().includes(term)
          || slotDateFormat(appointment.slotDate).toLowerCase().includes(term);

        const matchesDoctor = !doctorFilter || appointment.docData.name === doctorFilter;
        const matchesStatus = !statusFilter || visitStatus === statusFilter;

        return matchesSearch && matchesDoctor && matchesStatus;
      })
      .sort((left, right) => {
        if (sortBy === 'patient') return left.userData.name.localeCompare(right.userData.name);
        if (sortBy === 'doctor') return left.docData.name.localeCompare(right.docData.name);
        if (sortBy === 'date') return left.slotDate.localeCompare(right.slotDate);
        return 0;
      });
  }, [appointments, doctorFilter, searchTerm, slotDateFormat, sortBy, statusFilter]);

  if (!appointments.length && sToken) {
    return <LoadingState label="Loading front-desk appointments..." />;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Staff appointments"
        title="Support arrivals, movement, and exceptions with one clear front-desk flow."
        description="The desk should understand what is waiting, who has arrived, and what can still be cancelled or billed without guessing."
        actions={(
          <button type="button" className="soft-button-accent" onClick={() => navigate('/staff-billing')}>
            Open billing
          </button>
        )}
      />

      <SurfaceCard className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            placeholder="Search patient, doctor, or date"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="soft-input"
          />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="soft-select">
            <option value="">Sort by</option>
            <option value="patient">Patient name</option>
            <option value="doctor">Doctor name</option>
            <option value="date">Date</option>
          </select>
          <select value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)} className="soft-select">
            <option value="">All doctors</option>
            {doctorNames.map((doctor) => (
              <option key={doctor} value={doctor}>{doctor}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="soft-select">
            <option value="">All visit states</option>
            <option value="requested">Requested</option>
            <option value="accepted">Accepted</option>
            <option value="checked_in">Checked in</option>
            <option value="in_consultation">In consultation</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {filteredAppointments.length === 0 ? (
          <EmptyState title="No appointment records found" description="Try a broader search or change the active filters." />
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((item) => {
              const visitStatusMeta = getVisitStatusMeta(item);

              return (
                <div key={item._id} className="grid gap-4 rounded-[26px] border border-slate-100 bg-slate-50/80 p-4 xl:grid-cols-[1.2fr_0.9fr_1.15fr_0.85fr_1.3fr] xl:items-center">
                  <div className="flex items-center gap-3">
                    <img src={item.userData.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.userData.name}</p>
                        <StatusBadge tone={visitStatusMeta.tone}>{visitStatusMeta.label}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{calculateAge(item.userData.dob)} years</p>
                      <p className="mt-1 text-xs text-slate-400">{visitStatusMeta.description}</p>
                    </div>
                  </div>

                  <div>
                    <p className="table-head">Date and time</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{slotDateFormat(item.slotDate)}</p>
                    <p className="text-xs text-slate-500">{item.slotTime}</p>
                  </div>

                  <div>
                    <p className="table-head">Doctor</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.docData.name}</p>
                    <p className="text-xs text-slate-500">{item.docData.speciality}</p>
                  </div>

                  <div>
                    <p className="table-head">Billing</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{currency}{item.amount}</p>
                    <StatusBadge tone={item.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {item.paymentStatus || 'unpaid'}
                    </StatusBadge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isVisitActionableForBilling(item) ? (
                      <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => navigate('/staff-billing')}>
                        Billing
                      </button>
                    ) : null}
                    {canCheckInAppointment(item) ? (
                      <button type="button" className="soft-button-accent px-4 py-2 text-xs" onClick={() => checkInAppointment(item._id)}>
                        Check in
                      </button>
                    ) : null}
                    {canCancelAppointment(item) ? (
                      <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => cancelAppointment(item._id)}>
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
};

export default StaffAppointments;
