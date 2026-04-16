import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import EmptyState from '../../components/backoffice/EmptyState';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';

const DoctorAppointments = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    cancelAppointment,
    completeAppointment,
    acceptAppointment,
    backendUrl,
  } = useContext(DoctorContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);

  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [currentMed, setCurrentMed] = useState({ name: '', dosage: '', duration: '', instruction: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((item) => {
        const term = searchTerm.toLowerCase();
        return (
          item.userData.name.toLowerCase().includes(term) ||
          item.docData.name.toLowerCase().includes(term) ||
          slotDateFormat(item.slotDate).toLowerCase().includes(term)
        );
      }),
    [appointments, searchTerm, slotDateFormat],
  );

  const addNote = async (appointmentId) => {
    const note = window.prompt('Enter a note for this appointment.');
    if (!note) return;

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/add-notes`,
        { appointmentId, notes: note },
        { headers: { dToken } },
      );

      if (data.success) {
        toast.success('Note added');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddMed = () => {
    if (!currentMed.name || !currentMed.dosage) {
      toast.error('Medicine name and dosage are required.');
      return;
    }

    setMedicines((prev) => [...prev, currentMed]);
    setCurrentMed({ name: '', dosage: '', duration: '', instruction: '' });
  };

  const submitPrescription = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/generate-prescription`,
        { appointmentId: currentAppointmentId, medicines },
        { headers: { dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        setShowPrescriptionModal(false);
        setMedicines([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!appointments.length && dToken) {
    return <LoadingState label="Loading your appointments..." />;
  }

  return (
    <>
      <div className="space-y-6 animate-soft-in">
        <PageHeader
          eyebrow="Doctor appointments"
          title="Everything you need for a consultation should stay in one focused workflow."
          description="Review patient basics, accept or complete visits, add notes, and draft prescriptions without bouncing between separate screens."
        />

        <SurfaceCard className="space-y-5">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="soft-input"
            placeholder="Search patient name, date, or appointment context"
          />

          {filteredAppointments.length === 0 ? (
            <EmptyState
              title="No appointments match this search"
              description="Try a broader search or wait for new patient bookings to arrive."
            />
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((item) => (
                <div key={item._id} className="grid gap-4 rounded-[26px] border border-slate-100 bg-slate-50/80 p-4 xl:grid-cols-[1.25fr_0.8fr_0.85fr_1.15fr] xl:items-center">
                  <div className="flex items-center gap-3">
                    <img src={item.userData.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.userData.name}</p>
                        {item.cancelled ? (
                          <StatusBadge tone="danger">Cancelled</StatusBadge>
                        ) : item.isCompleted ? (
                          <StatusBadge tone="success">Completed</StatusBadge>
                        ) : item.isAccepted ? (
                          <StatusBadge tone="info">Accepted</StatusBadge>
                        ) : (
                          <StatusBadge tone="warning">Pending review</StatusBadge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {calculateAge(item.userData.dob)} years • {slotDateFormat(item.slotDate)} • {item.slotTime}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="table-head">Payment</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.paymentStatus || 'unpaid'}</p>
                    <p className="text-xs text-slate-500">{currency}{item.amount}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!item.cancelled && !item.isCompleted ? (
                      <>
                        {!item.isAccepted ? (
                          <button type="button" className="soft-button-accent px-4 py-2 text-xs" onClick={() => acceptAppointment(item._id)}>
                            Accept
                          </button>
                        ) : (
                          <button type="button" className="soft-button-accent px-4 py-2 text-xs" onClick={() => completeAppointment(item._id)}>
                            Complete
                          </button>
                        )}
                        <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => cancelAppointment(item._id)}>
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => addNote(item._id)}>
                      Add note
                    </button>
                    <button
                      type="button"
                      className="soft-button-secondary px-4 py-2 text-xs"
                      onClick={() => {
                        setCurrentAppointmentId(item._id);
                        setShowPrescriptionModal(true);
                      }}
                    >
                      Prescribe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>

      {showPrescriptionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Prescription</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Draft medication plan</h2>
              </div>
              <button type="button" className="soft-button-secondary px-4 py-2" onClick={() => setShowPrescriptionModal(false)}>
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input className="soft-input" placeholder="Medicine name" value={currentMed.name} onChange={(event) => setCurrentMed({ ...currentMed, name: event.target.value })} />
              <input className="soft-input" placeholder="Dosage" value={currentMed.dosage} onChange={(event) => setCurrentMed({ ...currentMed, dosage: event.target.value })} />
              <input className="soft-input" placeholder="Duration" value={currentMed.duration} onChange={(event) => setCurrentMed({ ...currentMed, duration: event.target.value })} />
              <input className="soft-input" placeholder="Instruction" value={currentMed.instruction} onChange={(event) => setCurrentMed({ ...currentMed, instruction: event.target.value })} />
            </div>

            <div className="mt-4">
              <button type="button" className="soft-button-accent px-4 py-3" onClick={handleAddMed}>
                Add medicine
              </button>
            </div>

            <div className="mt-6 max-h-[220px] space-y-3 overflow-y-auto">
              {medicines.map((medicine, index) => (
                <div key={`${medicine.name}-${index}`} className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">{medicine.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {medicine.dosage} • {medicine.duration || 'Duration pending'} • {medicine.instruction || 'No extra instruction'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="soft-button-secondary px-4 py-3" onClick={() => setShowPrescriptionModal(false)}>
                Cancel
              </button>
              <button type="button" className="soft-button-primary px-4 py-3" onClick={submitPrescription}>
                Submit prescription
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DoctorAppointments;
