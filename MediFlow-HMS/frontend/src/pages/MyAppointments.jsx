import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { formatSlotDate } from '@shared/utils/date.js';
import { AppContext } from '../context/AppContext';
import PatientPortalLayout from '../components/PatientPortalLayout';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import { buildSlotDateKey, getAppointmentStage, getPaymentStage, normalizeDoctorSlots } from '../utils/appointments';

const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MyAppointments = () => {
  const { backendUrl, token, currencySymbol } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, { headers: { token } });
      if (data.success) {
        setAppointments((data.appointments || []).slice().reverse());
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserPrescriptions = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/prescriptions`, { headers: { token } });
      if (data.success) {
        const nextPrescriptions = {};
        data.prescriptions.forEach((prescription) => {
          nextPrescriptions[prescription.appointmentId] = prescription;
        });
        setPrescriptions(nextPrescriptions);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openRescheduleModal = async (appointment) => {
    setSelectedAppointment(appointment);
    setSlotTime('');
    setSlotIndex(0);
    setShowReschedule(true);

    try {
      const { data } = await axios.get(`${backendUrl}/api/user/doctor-slots/${appointment.docId}`);
      if (data.success) {
        const slotsWithDates = normalizeDoctorSlots(data.slots);
        setDocSlots(slotsWithDates);
        const firstAvailableIndex = slotsWithDates.findIndex((day) => day.length > 0);
        if (firstAvailableIndex !== -1) {
          setSlotIndex(firstAvailableIndex);
        }
      }
    } catch (error) {
      toast.error('Failed to load available slots.');
    }
  };

  const confirmReschedule = async () => {
    if (!slotTime) {
      toast.warning('Please select a slot.');
      return;
    }

    const selectedDate = docSlots[slotIndex]?.[0]?.datetime;
    if (!selectedDate) {
      toast.error('Selected day has no available slots.');
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/reschedule-appointment`,
        {
          appointmentId: selectedAppointment._id,
          newSlotDate: buildSlotDateKey(selectedDate),
          newSlotTime: slotTime,
        },
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message);
        setShowReschedule(false);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    getUserAppointments();
    getUserPrescriptions();
  }, [token]);

  const stats = useMemo(() => {
    const upcoming = appointments.filter((appointment) => !appointment.cancelled && !appointment.isCompleted).length;
    const completed = appointments.filter((appointment) => appointment.isCompleted).length;
    const paid = appointments.filter((appointment) => appointment.payment || appointment.paymentStatus === 'paid').length;

    return [
      { label: 'Upcoming', value: upcoming || '0' },
      { label: 'Completed', value: completed || '0' },
      { label: 'Paid visits', value: paid || '0' },
    ];
  }, [appointments]);

  if (!token) {
    return (
      <div className="section-space">
        <EmptyState
          title="Sign in to view appointments"
          description="Your patient portal keeps upcoming visits, history, and billing in one place."
          action={<Link to="/login" className="app-button">Go to login</Link>}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState title="Loading appointments" message="Gathering your upcoming visits, status updates, and history." fullHeight />;
  }

  return (
    <>
      <PatientPortalLayout
        title="Appointments"
        description="Upcoming visits, reschedules, details, and prescription availability now live in a single, clearer portal view."
        stats={stats}
        actions={
          <Link to="/doctors" className="app-button">
            Book another visit
          </Link>
        }
      >
        {appointments.length > 0 ? (
          appointments.map((appointment) => {
            const appointmentStage = getAppointmentStage(appointment);
            const paymentStage = getPaymentStage(appointment);
            const hasPrescription = Boolean(prescriptions[appointment._id]);

            return (
              <article key={appointment._id} className="app-card overflow-hidden">
                <div className="grid gap-0 lg:grid-cols-[220px,minmax(0,1fr)]">
                  <div className="bg-[linear-gradient(180deg,#dff5f3_0%,#eff6ff_100%)] p-4">
                    <img
                      src={appointment.docData.image}
                      alt={appointment.docData.name}
                      className="h-full max-h-[220px] w-full rounded-[24px] object-cover"
                    />
                  </div>

                  <div className="space-y-5 px-6 py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-2xl font-bold text-secondary">{appointment.docData.name}</p>
                        <p className="mt-1 text-sm font-semibold text-primary">{appointment.docData.speciality}</p>
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                          {appointment.docData.address?.line1}
                          {appointment.docData.address?.line2 ? `, ${appointment.docData.address.line2}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone={appointmentStage.tone}>{appointmentStage.label}</StatusBadge>
                        <StatusBadge tone={paymentStage.tone}>{paymentStage.label}</StatusBadge>
                        {hasPrescription ? <StatusBadge tone="info">Prescription available</StatusBadge> : null}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">When</p>
                        <p className="mt-2 text-lg font-bold text-secondary">{formatSlotDate(appointment.slotDate)}</p>
                        <p className="text-sm text-slate-500">{appointment.slotTime}</p>
                      </div>
                      <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Amount</p>
                        <p className="mt-2 text-lg font-bold text-secondary">
                          {currencySymbol}
                          {appointment.amount}
                        </p>
                        <p className="text-sm text-slate-500">Consultation fee</p>
                      </div>
                      <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Doctor review</p>
                        <p className="mt-2 text-lg font-bold text-secondary">{appointment.isAccepted ? 'Accepted' : 'Awaiting confirmation'}</p>
                        <p className="text-sm text-slate-500">Live appointment state</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button onClick={() => navigate(`/my-appointments/${appointment._id}`)} className="app-button">
                        View details
                      </button>
                      {!appointment.cancelled && !appointment.isCompleted ? (
                        <button onClick={() => openRescheduleModal(appointment)} className="app-button-secondary">
                          Reschedule
                        </button>
                      ) : null}
                      {!appointment.cancelled && !appointment.isCompleted ? (
                        <button onClick={() => cancelAppointment(appointment._id)} className="app-button-secondary text-rose-600">
                          Cancel appointment
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            title="No appointments yet"
            description="Once you book a consultation, your upcoming schedule and history will appear here."
            action={<Link to="/doctors" className="app-button">Find a doctor</Link>}
          />
        )}
      </PatientPortalLayout>

      {showReschedule ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-secondary/40 px-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Reschedule appointment</p>
                <h3 className="mt-2 text-3xl font-bold text-secondary">Choose a better slot</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Update your appointment with Dr. {selectedAppointment?.docData?.name}.
                </p>
              </div>
              <button onClick={() => setShowReschedule(false)} className="app-button-ghost">
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {docSlots.filter((day) => day.length > 0).map((day, index) => {
                  const firstSlot = day[0];
                  const actualIndex = docSlots.findIndex((slotGroup) => slotGroup === day);
                  return (
                    <button
                      key={`${firstSlot.datetime.toISOString()}-${index}`}
                      onClick={() => {
                        setSlotIndex(actualIndex);
                        setSlotTime('');
                      }}
                      className={`min-w-[96px] rounded-[24px] px-4 py-4 text-center ${
                        slotIndex === actualIndex ? 'bg-secondary text-white' : 'border border-slate-200 bg-white text-secondary'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]">{daysOfWeek[firstSlot.datetime.getDay()]}</p>
                      <p className="mt-2 text-2xl font-bold">{firstSlot.datetime.getDate()}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3">
                {(docSlots[slotIndex] || []).map((slot) => (
                  <button
                    key={`${slot.time}-${slot.datetime.toISOString()}`}
                    onClick={() => setSlotTime(slot.time)}
                    className={`rounded-full px-4 py-3 text-sm font-semibold ${
                      slot.time === slotTime ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={confirmReschedule} className="app-button">
                  Confirm reschedule
                </button>
                <button onClick={() => setShowReschedule(false)} className="app-button-secondary">
                  Keep current appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MyAppointments;
