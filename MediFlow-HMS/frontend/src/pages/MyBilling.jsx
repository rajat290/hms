import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { formatSlotDate } from '@shared/utils/date.js';
import { AppContext } from '../context/AppContext';
import PatientPortalLayout from '../components/PatientPortalLayout';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import StatusBadge from '../components/ui/StatusBadge';
import { downloadInvoicePdf } from '../utils/documents';
import { getPaymentStage } from '../utils/appointments';

const MyBilling = () => {
  const { backendUrl, token, currencySymbol } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [financials, setFinancials] = useState({ totalPaid: 0, pendingDues: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBillingData = async () => {
    try {
      const [appointmentsResponse, financialsResponse] = await Promise.all([
        axios.get(`${backendUrl}/api/user/appointments`, { headers: { token } }),
        axios.get(`${backendUrl}/api/user/financial-summary`, { headers: { token } }),
      ]);

      if (appointmentsResponse.data.success) {
        setAppointments((appointmentsResponse.data.appointments || []).slice().reverse());
      }

      if (financialsResponse.data.success) {
        setFinancials({
          totalPaid: financialsResponse.data.totalPaid,
          pendingDues: financialsResponse.data.pendingDues,
        });
      }
    } catch (error) {
      toast.error('Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchBillingData();
  }, [token]);

  const stats = useMemo(
    () => [
      { label: 'Total paid', value: `${currencySymbol}${financials.totalPaid}` },
      { label: 'Pending dues', value: `${currencySymbol}${financials.pendingDues}` },
      { label: 'Invoices ready', value: appointments.filter((appointment) => appointment.payment || appointment.paymentStatus === 'paid').length || '0' },
    ],
    [appointments, currencySymbol, financials.pendingDues, financials.totalPaid],
  );

  if (!token) {
    return (
      <div className="section-space">
        <EmptyState
          title="Sign in to open billing"
          description="Invoices, payment history, and due amounts are available from the secure patient portal."
          action={<Link to="/login" className="app-button">Go to login</Link>}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState title="Loading billing" message="Collecting invoices, payments, and financial summaries." fullHeight />;
  }

  return (
    <PatientPortalLayout
      title="Billing and payments"
      description="A cleaner billing area with stronger summaries and clearer invoice actions."
      stats={stats}
    >
      {appointments.length > 0 ? (
        appointments.map((appointment) => {
          const paymentStage = getPaymentStage(appointment);

          return (
            <article key={appointment._id} className="app-card px-6 py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-2xl font-bold text-secondary">{appointment.docData.name}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{appointment.docData.speciality}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Visit on {formatSlotDate(appointment.slotDate)} at {appointment.slotTime}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={paymentStage.tone}>{paymentStage.label}</StatusBadge>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Amount</p>
                  <p className="mt-2 text-lg font-bold text-secondary">
                    {currencySymbol}
                    {appointment.amount}
                  </p>
                </div>
                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Invoice status</p>
                  <p className="mt-2 text-lg font-bold text-secondary">{appointment.payment || appointment.paymentStatus === 'paid' ? 'Ready' : 'Pending payment'}</p>
                </div>
                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Payment path</p>
                  <p className="mt-2 text-lg font-bold text-secondary">{appointment.paymentMethod || 'Online or cash'}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {appointment.payment || appointment.paymentStatus === 'paid' ? (
                  <button onClick={() => downloadInvoicePdf(appointment, currencySymbol)} className="app-button">
                    Download invoice
                  </button>
                ) : (
                  <button onClick={() => navigate(`/my-appointments/${appointment._id}`)} className="app-button">
                    Pay now
                  </button>
                )}
                <button onClick={() => navigate(`/my-appointments/${appointment._id}`)} className="app-button-secondary">
                  View appointment
                </button>
              </div>
            </article>
          );
        })
      ) : (
        <EmptyState
          title="No billing history yet"
          description="Invoices will appear here once appointments are booked and payments begin flowing through the portal."
          action={<Link to="/doctors" className="app-button">Book a consultation</Link>}
        />
      )}
    </PatientPortalLayout>
  );
};

export default MyBilling;
