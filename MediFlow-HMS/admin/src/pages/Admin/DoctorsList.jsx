import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import EmptyState from '../../components/backoffice/EmptyState';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import EditDoctorModal from './EditDoctorModal';

const DoctorsList = () => {
  const { doctors, changeAvailability, aToken, getAllDoctors, backendUrl } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [specialityFilter, setSpecialityFilter] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDoctorData, setEditDoctorData] = useState(null);

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  const specialities = useMemo(
    () => Array.from(new Set(doctors.map((doctor) => doctor.speciality))),
    [doctors],
  );

  const filteredDoctors = useMemo(
    () =>
      doctors
        .filter((doctor) => {
          const term = searchTerm.toLowerCase();
          const matchesSearch =
            doctor.name.toLowerCase().includes(term) ||
            doctor.speciality.toLowerCase().includes(term);

          return matchesSearch && (!specialityFilter || doctor.speciality === specialityFilter);
        })
        .sort((left, right) => {
          if (sortBy === 'name') return left.name.localeCompare(right.name);
          if (sortBy === 'speciality') return left.speciality.localeCompare(right.speciality);
          return 0;
        }),
    [doctors, searchTerm, specialityFilter, sortBy],
  );

  const handleEditDoctor = (doctor) => {
    setEditDoctorData(doctor);
    setEditModalOpen(true);
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/delete-doctor/${doctorId}`, {
        headers: { aToken },
      });

      if (data.success) {
        toast.success('Doctor deleted successfully');
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!doctors.length && aToken) {
    return <LoadingState label="Loading doctor roster..." />;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Doctor roster"
        title="Make profile management feel more like scheduling a team than editing a spreadsheet."
        description="Availability, speciality, and access status should be obvious enough that any admin can maintain the roster with confidence."
      />

      <SurfaceCard className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search doctor name or speciality"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="soft-input"
          />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="soft-select">
            <option value="">Sort by</option>
            <option value="name">Name</option>
            <option value="speciality">Speciality</option>
          </select>
          <select value={specialityFilter} onChange={(event) => setSpecialityFilter(event.target.value)} className="soft-select">
            <option value="">All specialities</option>
            {specialities.map((speciality) => (
              <option key={speciality} value={speciality}>{speciality}</option>
            ))}
          </select>
        </div>

        {filteredDoctors.length === 0 ? (
          <EmptyState title="No doctors match these filters" description="Try clearing the speciality filter or searching with a broader term." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <div key={doctor._id} className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <img src={doctor.image} alt="" className="h-20 w-20 rounded-[24px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold text-slate-900">{doctor.name}</p>
                      {doctor.available ? <StatusBadge tone="success">Available</StatusBadge> : <StatusBadge tone="danger">Unavailable</StatusBadge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{doctor.speciality}</p>
                    <p className="mt-3 text-sm font-medium text-slate-700">Consultation fee: INR {doctor.fees}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 rounded-[22px] border border-white/70 bg-white/80 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Availability</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">Toggle booking visibility</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={doctor.available}
                      onChange={() => changeAvailability(doctor._id)}
                    />
                    <span className="h-7 w-14 rounded-full bg-slate-200 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-teal-500 peer-checked:after:translate-x-7" />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" className="soft-button-accent px-4 py-2 text-xs" onClick={() => handleEditDoctor(doctor)}>
                    Edit profile
                  </button>
                  <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => handleDeleteDoctor(doctor._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      {editModalOpen && editDoctorData ? (
        <EditDoctorModal
          doctor={editDoctorData}
          onClose={() => setEditModalOpen(false)}
          onUpdated={() => {
            setEditModalOpen(false);
            getAllDoctors();
          }}
        />
      ) : null}
    </div>
  );
};

export default DoctorsList;
