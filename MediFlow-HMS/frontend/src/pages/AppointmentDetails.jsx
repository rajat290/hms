import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatSlotDate } from '@shared/utils/date.js';
import { AppContext } from '../context/AppContext';
import PatientPortalLayout from '../components/PatientPortalLayout';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import StatusBadge from '../components/ui/StatusBadge';
import { downloadInvoicePdf, downloadPrescriptionPdf } from '../utils/documents';
import { getAppointmentStage, getPaymentStage } from '../utils/appointments';

const AppointmentDetails = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, token, currencySymbol } = useContext(AppContext);

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState({});

  const fetchAppointmentDetails = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, { headers: { token } });
      if (data.success) {
        const selectedAppointment = data.appointments.find((item) => item._id === appointmentId);
        if (selectedAppointment) {
          setAppointment(selectedAppointment);
        } else {
          toast.error('Appointment not found.');
          navigate('/my-appointments');
        }
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
        const prescriptionMap = {};
        data.prescriptions.forEach((prescription) => {
          prescriptionMap[prescription.appointmentId] = prescription;
        });
        setPrescriptions(prescriptionMap);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const cancelAppointment = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message);
        fetchAppointmentDetails();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Appointment Payment',
      description: 'Appointment Payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(`${backendUrl}/api/user/verifyRazorpay`, response, { headers: { token } });
          if (data.success) {
            toast.success('Payment successful.');
            fetchAppointmentDetails();
          }
        } catch (error) {
          toast.error(error.message);
        }
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const appointmentRazorpay = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-razorpay`,
        { appointmentId },
        { headers: { token } },
      );
      if (data.success) {
        initPay(data.order);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!token || !appointmentId) {
      setLoading(false);
      return;
    }

    fetchAppointmentDetails();
    getUserPrescriptions();
  }, [appointmentId, token]);

  const stats = useMemo(() => {
    if (!appointment) {
      return [];
    }

    return [
      { label: 'Appointment state', value: getAppointmentStage(appointment).label },
      { label: 'Payment state', value: getPaymentStage(appointment).label },
      { label: 'Consultation fee', value: `${currencySymbol}${appointment.amount}` },
    ];
  }, [appointment, currencySymbol]);

  if (!token) {
    return (
      <div className="section-space">
        <EmptyState
          title="Sign in to view appointment details"
          description="Your appointment history is stored securely inside the patient portal."
          action={<Link to="/login" className="app-button">Go to login</Link>}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState title="Loading appointment details" message="Preparing doctor information, payment state, and related documents." fullHeight />;
  }

  if (!appointment) {
    return null;
  }

  const appointmentStage = getAppointmentStage(appointment);
  const paymentStage = getPaymentStage(appointment);
  const prescription = prescriptions[appointment._id];

  return (
    <PatientPortalLayout
      title="Appointment details"
      description="A cleaner breakdown of doctor information, status, actions, and downloadable documents."
      stats={stats}
      actions={
        <Link to="/my-appointments" className="app-button-secondary">
          Back to appointments
        </Link>
      }
    >
      <article className="app-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[280px,minmax(0,1fr)]">
          <div className="bg-[linear-gradient(180deg,#dff5f3_0%,#eff6ff_100%)] p-4">
            <img src={appointment.docData.image} alt={appointment.docData.name} className="h-full w-full rounded-[26px] object-cover" />
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-3xl font-bold text-secondary">{appointment.docData.name}</p>
                <p className="mt-2 text-sm font-semibold text-primary">{appointment.docData.speciality}</p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                  {appointment.docData.address?.line1}
                  {appointment.docData.address?.line2 ? `, ${appointment.docData.address.line2}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={appointmentStage.tone}>{appointmentStage.label}</StatusBadge>
                <StatusBadge tone={paymentStage.tone}>{paymentStage.label}</StatusBadge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Appointment date</p>
                <p className="mt-2 text-lg font-bold text-secondary">{formatSlotDate(appointment.slotDate)}</p>
                <p className="text-sm text-slate-500">{appointment.slotTime}</p>
              </div>
              <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Fee</p>
                <p className="mt-2 text-lg font-bold text-secondary">
                  {currencySymbol}
                  {appointment.amount}
                </p>
                <p className="text-sm text-slate-500">Consultation amount</p>
              </div>
              <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Doctor review</p>
                <p className="mt-2 text-lg font-bold text-secondary">{appointment.isAccepted ? 'Accepted' : 'Pending'}</p>
                <p className="text-sm text-slate-500">Confirmation status</p>
              </div>
            </div>

            {appointment.notes?.length ? (
              <div className="rounded-[26px] bg-amber-50 px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Doctor notes</p>
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-amber-900">
                  {appointment.notes.map((note, index) => (
                    <li key={`${note}-${index}`} className="rounded-[18px] bg-white/60 px-4 py-3">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {!appointment.cancelled && !appointment.isCompleted && !appointment.payment && appointment.paymentStatus !== 'paid' ? (
                <button onClick={appointmentRazorpay} className="app-button">
                  Pay online (
                  {currencySymbol}
                  {appointment.amount})
                </button>
              ) : null}
              {!appointment.cancelled && !appointment.isCompleted ? (
                <button onClick={cancelAppointment} className="app-button-secondary text-rose-600">
                  Cancel appointment
                </button>
              ) : null}
              {appointment.payment || appointment.paymentStatus === 'paid' ? (
                <button onClick={() => downloadInvoicePdf(appointment, currencySymbol)} className="app-button-secondary">
                  Download invoice
                </button>
              ) : null}
              {prescription ? (
                <button onClick={() => downloadPrescriptionPdf(prescription, appointment)} className="app-button-secondary">
                  Download prescription
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </PatientPortalLayout>
  );
};

export default AppointmentDetails;
