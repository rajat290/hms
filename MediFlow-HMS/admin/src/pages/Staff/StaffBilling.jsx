import React, { useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { StaffContext } from '../../context/StaffContext';
import { AppContext } from '../../context/AppContext';
import EmptyState from '../../components/backoffice/EmptyState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import { isVisitActionableForBilling } from '../../utils/appointmentLifecycle';

const StaffBilling = () => {
  const { appointments, updatePayment } = useContext(StaffContext);
  const { slotDateFormat, currency } = useContext(AppContext);

  const [selectedAppt, setSelectedAppt] = useState(null);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', cost: '' });

  const filteredAppts = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          (appointment.userData.name.toLowerCase().includes(search.toLowerCase()) ||
            appointment._id.includes(search)) &&
          isVisitActionableForBilling(appointment),
      ),
    [appointments, search],
  );

  const selectAppt = (appointment) => {
    setSelectedAppt(appointment);
    setItems(appointment.billingItems || []);
  };

  const addItem = () => {
    if (!newItem.name || !newItem.cost) return;
    setItems((prev) => [...prev, { name: newItem.name, cost: Number(newItem.cost) }]);
    setNewItem({ name: '', cost: '' });
  };

  const totalAmount = (selectedAppt?.amount || 0) + items.reduce((accumulator, item) => accumulator + item.cost, 0);

  const handlePayment = async () => {
    if (!selectedAppt) return;
    await updatePayment(selectedAppt._id, 'paid', paymentMethod, totalAmount, items);
    toast.success('Payment recorded successfully.');
    setSelectedAppt(null);
    setItems([]);
  };

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Staff billing"
        title="Turn visits into payments without making the desk feel like an accounting tool."
        description="Pick the visit, review charges, add extras, and collect payment with a single focused billing workflow."
      />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <SurfaceCard className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Appointment list</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Choose a visit to invoice</h2>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search by patient name or appointment ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="soft-input"
          />

          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {filteredAppts.map((item) => (
              <button
                type="button"
                key={item._id}
                onClick={() => selectAppt(item)}
                className={`w-full rounded-[26px] border p-4 text-left transition ${
                  selectedAppt?._id === item._id
                    ? 'border-teal-200 bg-teal-50/80'
                    : 'border-slate-100 bg-slate-50/80 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.userData.name}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{item._id.slice(-8)}</p>
                  </div>
                  {item.paymentStatus === 'paid' ? <StatusBadge tone="success">Paid</StatusBadge> : <StatusBadge tone="warning">{item.paymentStatus}</StatusBadge>}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                  <span>{slotDateFormat(item.slotDate)} • {item.slotTime}</span>
                  <span className="font-semibold text-slate-900">{currency}{item.amount}</span>
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        {!selectedAppt ? (
          <EmptyState
            title="Select an appointment to start billing"
            description="The invoice builder opens here once you choose a patient visit from the list."
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <SurfaceCard className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Invoice</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selectedAppt.userData.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{slotDateFormat(selectedAppt.slotDate)} • {selectedAppt.slotTime}</p>
                </div>
                <StatusBadge tone={selectedAppt.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  {selectedAppt.paymentStatus}
                </StatusBadge>
              </div>

              <div className="space-y-3 rounded-[24px] border border-slate-100 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">Consultation fee</span>
                  <span className="font-semibold text-slate-900">{currency}{selectedAppt.amount}</span>
                </div>

                {items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">{item.name}</span>
                    <span className="font-semibold text-slate-900">{currency}{item.cost}</span>
                  </div>
                ))}

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Grand total</span>
                    <span className="text-3xl font-semibold text-slate-950">{currency}{totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {['Cash', 'Card', 'UPI', 'EMI'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      paymentMethod === method
                        ? 'bg-slate-950 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className="soft-button-secondary" onClick={() => window.print()}>
                  Print receipt
                </button>
                <button type="button" className="soft-button-primary" onClick={handlePayment}>
                  Receive {currency}{totalAmount}
                </button>
              </div>
            </SurfaceCard>

            <SurfaceCard className="space-y-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Add charges</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Itemized billing</h2>
                <p className="mt-1 text-sm text-slate-500">Add lab tests, medication, or extra services before collecting payment.</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                  className="soft-input"
                  placeholder="Charge description"
                />
                <input
                  type="number"
                  value={newItem.cost}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, cost: event.target.value }))}
                  className="soft-input"
                  placeholder={`Charge amount (${currency})`}
                />
                <button type="button" className="soft-button-accent w-full" onClick={addItem}>
                  Add charge
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{currency}{item.cost}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffBilling;
