import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffContext } from '../../context/StaffContext';
import EmptyState from '../../components/backoffice/EmptyState';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';

const StaffPatients = () => {
  const navigate = useNavigate();
  const { sToken, patients, getAllPatients } = useContext(StaffContext);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (sToken) {
      Promise.resolve(getAllPatients()).finally(() => setLoading(false));
    }
  }, [sToken]);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const term = searchTerm.toLowerCase();
        return (
          patient.name.toLowerCase().includes(term) ||
          patient.email.toLowerCase().includes(term) ||
          patient.phone.includes(searchTerm)
        );
      }),
    [patients, searchTerm],
  );

  if (loading) {
    return <LoadingState label="Loading patient records..." />;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Staff patients"
        title="Patient search should feel instant and easy, even for a busy front desk."
        description="Surface the right record quickly, then let staff jump directly into booking, billing, or profile review without extra navigation noise."
        actions={
          <button type="button" className="soft-button-accent" onClick={() => navigate('/staff-add-patient')}>
            Add patient
          </button>
        }
      />

      <SurfaceCard className="space-y-5">
        <input
          type="text"
          placeholder="Search by patient name, phone, or email"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="soft-input"
        />

        {filteredPatients.length === 0 ? (
          <EmptyState title="No patient record found" description="Try searching with phone or email if the patient name is not enough." />
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((patient) => (
              <div key={patient._id} className="grid gap-4 rounded-[26px] border border-slate-100 bg-slate-50/80 p-4 xl:grid-cols-[1.2fr_1fr_0.9fr_1.15fr] xl:items-center">
                <div className="flex items-center gap-3">
                  <img src={patient.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                      {patient.patientCategory !== 'Standard' ? (
                        <StatusBadge tone={patient.patientCategory === 'VIP' ? 'warning' : patient.patientCategory === 'High-risk' ? 'danger' : 'info'}>
                          {patient.patientCategory}
                        </StatusBadge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{patient.phone || 'No phone on record'}</p>
                  </div>
                </div>
                <div>
                  <p className="table-head">Contact</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{patient.email}</p>
                </div>
                <div>
                  <p className="table-head">Address</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{typeof patient.address === 'object' ? (patient.address.line1 || 'Not set') : patient.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => navigate('/staff-appointments')}>
                    Book
                  </button>
                  <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => navigate('/staff-billing')}>
                    Bill
                  </button>
                  <button type="button" className="soft-button-accent px-4 py-2 text-xs" onClick={() => navigate(`/staff-patient-profile/${patient._id}`)}>
                    View profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
};

export default StaffPatients;
