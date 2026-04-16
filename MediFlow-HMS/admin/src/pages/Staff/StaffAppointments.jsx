import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffContext } from '../../context/StaffContext';
import { AppContext } from '../../context/AppContext';
import EmptyState from '../../components/backoffice/EmptyState';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';

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
        const matchesSearch =
          appointment.userData.name.toLowerCase().includes(term) ||
          appointment.docData.name.toLowerCase().includes(term) ||
          slotDateFormat(appointment.slotDate).toLowerCase().includes(term);

        const matchesDoctor = !doctorFilter || appointment.docData.name === doctorFilter;
        const matchesStatus =
          !statusFilter ||
          (statusFilter === 'completed'
            ? appointment.isCompleted
            : statusFilter === 'cancelled'
              ? appointment.cancelled
              : !appointment.cancelled && !appointment.isCompleted);

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
        title="Support bookings and arrivals without making staff decode the system."
        description="The front desk should be able to search, check in, send patients to billing, and cancel safely with clear status cues."
        actions={
          <button type="button" className="soft-button-accent" onClick={() => navigate('/staff-billing')}>
            Open billing
          </button>
        }
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
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {filteredAppointments.length === 0 ? (
          <EmptyState title="No appointment records found" description="Try a broader search or change the active filters." />
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((item) => (
              <div key={item._id} className="grid gap-4 rounded-[26px] border border-slate-100 bg-slate-50/80 p-4 xl:grid-cols-[1.2fr_0.9fr_1.15fr_0.85fr_1.2fr] xl:items-center">
                <div className="flex items-center gap-3">
                  <img src={item.userData.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.userData.name}</p>
                      {item.cancelled ? (
                        <StatusBadge tone="danger">Cancelled</StatusBadge>
                      ) : item.isCompleted ? (
                        <StatusBadge tone="success">Completed</StatusBadge>
                      ) : item.isCheckedIn ? (
                        <StatusBadge tone="info">Checked in</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">Awaiting check-in</StatusBadge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{calculateAge(item.userData.dob)} years</p>
                  </div>
                </div>

                <div>
                  <p className="table-head">Date & time</p>
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
                  {item.payment ? <StatusBadge tone="success">Paid</StatusBadge> : <StatusBadge tone="warning">Pending</StatusBadge>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {!item.cancelled && !item.isCompleted ? (
                    <>
                      {!item.payment ? (
                        <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => navigate('/staff-billing')}>
                          Billing
                        </button>
                      ) : null}
                      {!item.isCheckedIn ? (
                        <button type="button" className="soft-button-accent px-4 py-2 text-xs" onClick={() => checkInAppointment(item._id)}>
                          Check in
                        </button>
                      ) : null}
                      <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => cancelAppointment(item._id)}>
                        Cancel
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
};

export default StaffAppointments;
