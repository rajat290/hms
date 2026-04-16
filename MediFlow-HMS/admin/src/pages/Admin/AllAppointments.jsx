import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import EmptyState from '../../components/backoffice/EmptyState';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';

const AllAppointments = () => {
  const { aToken, appointments, cancelAppointment, acceptAppointment, getAllAppointments } = useContext(AdminContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken]);

  const doctorNames = useMemo(
    () => Array.from(new Set(appointments.map((appointment) => appointment.docData.name))),
    [appointments],
  );

  const filteredAppointments = useMemo(() => {
    const result = appointments
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

    return result;
  }, [appointments, doctorFilter, searchTerm, slotDateFormat, sortBy, statusFilter]);

  if (!appointments.length && aToken) {
    return <LoadingState label="Loading appointment records..." />;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Admin appointments"
        title="Keep every booking visible, searchable, and safe to action."
        description="Front-office staff and admins should be able to understand appointment state at a glance, not decode a dense table."
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
          <EmptyState
            title="No appointments match these filters"
            description="Try clearing one of the search or status filters to bring more records back into view."
          />
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((item, index) => (
              <div key={item._id} className="grid gap-4 rounded-[26px] border border-slate-100 bg-slate-50/80 p-4 xl:grid-cols-[0.35fr_1.2fr_0.8fr_1.2fr_1.2fr_0.8fr_1.1fr] xl:items-center">
                <div className="hidden text-sm font-semibold text-slate-400 xl:block">{index + 1}</div>
                <div className="flex items-center gap-3">
                  <img src={item.userData.image} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.userData.name}</p>
                    <p className="text-xs text-slate-500">{calculateAge(item.userData.dob)} years</p>
                  </div>
                </div>
                <div>
                  <p className="table-head">Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{slotDateFormat(item.slotDate)}</p>
                  <p className="text-xs text-slate-500">{item.slotTime}</p>
                </div>
                <div className="flex items-center gap-3">
                  <img src={item.docData.image} alt="" className="h-12 w-12 rounded-2xl object-cover bg-white" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.docData.name}</p>
                    <p className="text-xs text-slate-500">{item.docData.speciality}</p>
                  </div>
                </div>
                <div>
                  <p className="table-head">Fees</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{currency}{item.amount}</p>
                </div>
                <div>
                  <p className="table-head">Status</p>
                  <div className="mt-2">
                    {item.cancelled ? (
                      <StatusBadge tone="danger">Cancelled</StatusBadge>
                    ) : item.isCompleted ? (
                      <StatusBadge tone="success">Completed</StatusBadge>
                    ) : item.isAccepted ? (
                      <StatusBadge tone="info">Accepted</StatusBadge>
                    ) : (
                      <StatusBadge tone="warning">Pending</StatusBadge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!item.cancelled && !item.isCompleted ? (
                    <>
                      {!item.isAccepted ? (
                        <button type="button" className="soft-button-accent px-4 py-2 text-xs" onClick={() => acceptAppointment(item._id)}>
                          Accept
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

export default AllAppointments;
