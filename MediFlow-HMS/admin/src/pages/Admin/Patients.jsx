import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import EmptyState from '../../components/backoffice/EmptyState';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import SurfaceCard from '../../components/backoffice/SurfaceCard';

const Patients = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  useEffect(() => {
    const getAllPatients = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/admin/all-patients`, { headers: { aToken } });
        if (data.success) {
          setPatients(data.patients);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (aToken) {
      getAllPatients();
    }
  }, [aToken, backendUrl]);

  const filteredPatients = useMemo(
    () =>
      patients
        .filter((patient) => {
          const term = searchTerm.toLowerCase();
          const matchesSearch =
            patient.name.toLowerCase().includes(term) ||
            patient.email.toLowerCase().includes(term);
          const matchesPayment =
            !paymentFilter ||
            (paymentFilter === 'paid' ? patient.pendingDues === 0 : patient.pendingDues > 0);

          return matchesSearch && matchesPayment;
        })
        .sort((left, right) => {
          if (sortBy === 'name') return left.name.localeCompare(right.name);
          if (sortBy === 'email') return left.email.localeCompare(right.email);
          if (sortBy === 'paid') return left.totalPaid - right.totalPaid;
          if (sortBy === 'pending') return left.pendingDues - right.pendingDues;
          return 0;
        }),
    [patients, paymentFilter, searchTerm, sortBy],
  );

  if (loading) {
    return <LoadingState label="Loading patient records..." />;
  }

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Patient records"
        title="Financial visibility and patient lookup should feel reassuring, not risky."
        description="Make it easy for admins to search people quickly, understand balances, and jump into details without second-guessing the data."
      />

      <SurfaceCard className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <input type="text" placeholder="Search patient name or email" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="soft-input" />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="soft-select">
            <option value="">Sort by</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="paid">Total paid</option>
            <option value="pending">Pending dues</option>
          </select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="soft-select">
            <option value="">All payment status</option>
            <option value="paid">Fully paid</option>
            <option value="pending">Pending dues</option>
          </select>
        </div>

        {filteredPatients.length === 0 ? (
          <EmptyState title="No patient records found" description="Try a different search term or clear the payment filter." />
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((patient) => (
              <div key={patient._id} className="grid gap-4 rounded-[26px] border border-slate-100 bg-slate-50/80 p-4 xl:grid-cols-[1.3fr_1fr_0.9fr_0.9fr_0.8fr] xl:items-center">
                <div className="flex items-center gap-3">
                  <img src={patient.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                    <p className="text-sm text-slate-500">{patient.email}</p>
                  </div>
                </div>
                <div>
                  <p className="table-head">Total paid</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{patient.currency}{patient.totalPaid}</p>
                </div>
                <div>
                  <p className="table-head">Pending dues</p>
                  <p className="mt-2 text-sm font-semibold text-rose-600">{patient.currency}{patient.pendingDues}</p>
                </div>
                <div>
                  <p className="table-head">Phone</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{patient.phone || 'Not set'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="soft-button-accent px-4 py-2 text-xs" onClick={() => navigate(`/patient-details/${patient._id}`)}>
                    View details
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

export default Patients;
