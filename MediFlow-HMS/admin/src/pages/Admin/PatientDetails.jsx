import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import { formatSlotDate } from '@shared/utils/date.js';
import { getVisitStatusMeta } from '../../utils/appointmentLifecycle';

const PatientDetails = () => {
  const { userId } = useParams();
  const { aToken, backendUrl } = useContext(AdminContext);
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [financial, setFinancial] = useState({});
  const [prescriptions, setPrescriptions] = useState([]);

  const getPatientDetails = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/patient-details/${userId}`, { headers: { aToken } });
      if (data.success) {
        setPatient(data.patient);
        setAppointments(data.appointments);
        setFinancial(data.financial);
        setPrescriptions(data.prescriptions);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (aToken) {
      getPatientDetails();
    }
  }, [aToken]);

  if (!patient) {
    return <div className="m-5">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Patient profile"
        title={patient.name}
        description="A complete view of profile, finances, appointments, and prescriptions for support decisions."
        actions={(
          <button type="button" className="soft-button-secondary" onClick={() => navigate('/all-patients')}>
            Back to patients
          </button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Patient details</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="table-head">Name</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{patient.name}</p>
            </div>
            <div>
              <p className="table-head">Email</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{patient.email}</p>
            </div>
            <div>
              <p className="table-head">Phone</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{patient.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="table-head">Gender</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{patient.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="table-head">Date of birth</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{patient.dob || 'N/A'}</p>
            </div>
            <div>
              <p className="table-head">Address</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{patient.address?.line1 || 'N/A'}</p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Financial summary</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Payment snapshot</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Total spent</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">INR {financial?.totalSpent || 0}</p>
            </div>
            <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Pending payments</p>
              <p className="mt-2 text-3xl font-semibold text-amber-950">INR {financial?.pendingPayments || 0}</p>
            </div>
            <div className="rounded-[24px] border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm text-sky-700">Total appointments</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{financial?.totalAppointments || 0}</p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Appointment history</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Visit timeline</h2>
        </div>

        <div className="space-y-4">
          {appointments?.length > 0 ? appointments.map((item) => {
            const visitStatusMeta = getVisitStatusMeta(item);

            return (
              <div key={item._id} className="flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 md:flex-row md:items-center">
                <img className="h-16 w-16 rounded-2xl bg-gray-100 object-cover" src={item.docId?.image} alt="" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.docId?.name}</p>
                    <StatusBadge tone={visitStatusMeta.tone}>{visitStatusMeta.label}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.docId?.speciality}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatSlotDate(item.slotDate)} | {item.slotTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">INR {item.amount}</p>
                  <p className="text-xs text-slate-500">{item.paymentStatus || (item.payment ? 'paid' : 'unpaid')}</p>
                </div>
              </div>
            );
          }) : (
            <p className="text-slate-500">No appointments found</p>
          )}
        </div>
      </SurfaceCard>

      {prescriptions?.length > 0 ? (
        <SurfaceCard className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Prescriptions</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Clinical documents</h2>
          </div>
          <div className="space-y-3">
            {prescriptions.map((prescription, index) => (
              <div key={prescription._id || index} className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Prescription #{index + 1}</p>
                <p className="mt-1 text-sm text-slate-500">{prescription.medicines?.length || 0} medicines prescribed</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
};

export default PatientDetails;
