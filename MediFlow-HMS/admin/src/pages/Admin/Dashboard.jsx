import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { assets } from '../../assets/assets';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import LoadingState from '../../components/backoffice/LoadingState';
import PageHeader from '../../components/backoffice/PageHeader';
import StatCard from '../../components/backoffice/StatCard';
import StatusBadge from '../../components/backoffice/StatusBadge';
import SurfaceCard from '../../components/backoffice/SurfaceCard';
import { canCancelAppointment, getVisitStatusMeta } from '../../utils/appointmentLifecycle';

const Dashboard = () => {
  const navigate = useNavigate();
  const { aToken, dashData, getDashData, cancelAppointment } = useContext(AdminContext);
  const { slotDateFormat, currency, backendUrl } = useContext(AppContext);

  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    if (!aToken) return;

    getDashData();

    const fetchInsights = async () => {
      try {
        setLoadingInsights(true);
        const response = await fetch(`${backendUrl}/api/admin/advanced-analytics?granularity=daily`, {
          headers: { aToken },
        });
        const data = await response.json();

        if (data.success) {
          setInsights(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [aToken, backendUrl]);

  const revenueTrend = useMemo(
    () =>
      (insights?.performanceTrends || []).map((item) => ({
        date: item.date,
        revenue: item.revenue,
      })),
    [insights],
  );

  if (!dashData) {
    return <LoadingState label="Preparing the admin overview..." />;
  }

  const statCards = [
    {
      icon: assets.doctor_icon,
      label: 'Doctors',
      value: dashData.doctors,
      hint: 'Active doctor profiles',
      accent: 'from-sky-500 to-cyan-500',
      onClick: () => navigate('/doctor-list'),
    },
    {
      icon: assets.appointments_icon,
      label: 'Appointments',
      value: dashData.appointments,
      hint: 'All recorded bookings',
      accent: 'from-teal-500 to-emerald-500',
      onClick: () => navigate('/all-appointments'),
    },
    {
      icon: assets.patients_icon,
      label: 'Patients',
      value: dashData.patients,
      hint: 'Registered patient records',
      accent: 'from-amber-500 to-orange-500',
      onClick: () => navigate('/all-patients'),
    },
    {
      icon: assets.earning_icon,
      label: 'Revenue',
      value: `${currency}${(insights?.financial?.totalRevenue || 0).toLocaleString()}`,
      hint: 'Total captured revenue',
      accent: 'from-rose-500 to-pink-500',
      onClick: () => navigate('/billing'),
    },
  ];

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Admin overview"
        title="Run the hospital from one calm, visible control center."
        description="Watch patient flow, collections, cancellations, and staffing signals without forcing anyone to decode inconsistent appointment states."
        actions={(
          <>
            <button type="button" className="soft-button-secondary" onClick={() => navigate('/analytics')}>
              Open analytics
            </button>
            <button type="button" className="soft-button-accent" onClick={() => navigate('/billing')}>
              Review billing
            </button>
          </>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <SurfaceCard className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Revenue trend</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Daily financial momentum</h2>
              <p className="mt-1 text-sm text-slate-500">A quick read on the last recorded business cycle.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Outstanding</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-900">
                {currency}{(insights?.financial?.outstandingPayments || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {loadingInsights ? (
            <div className="flex h-[280px] items-center justify-center rounded-[24px] bg-slate-50 text-slate-500">
              Loading analytics...
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.34} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 18,
                      border: '1px solid rgba(148,163,184,0.16)',
                      boxShadow: '0 20px 40px rgba(15,23,42,0.08)',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={3} fill="url(#adminRevenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Top performers</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Doctor highlights</h2>
            </div>
            <button type="button" className="soft-button-secondary px-4 py-2" onClick={() => navigate('/doctor-list')}>
              View roster
            </button>
          </div>

          <div className="space-y-3">
            {(insights?.topDoctors || []).slice(0, 4).map((doctor) => (
              <div key={doctor.doctor._id} className="flex items-center gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
                <img src={doctor.doctor.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{doctor.doctor.name}</p>
                  <p className="truncate text-xs text-slate-500">{doctor.doctor.speciality}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{currency}{doctor.revenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{doctor.appointments} appts</p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <SurfaceCard className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Recent bookings</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Live appointment activity</h2>
            </div>
            <button type="button" className="soft-button-secondary px-4 py-2" onClick={() => navigate('/all-appointments')}>
              See all
            </button>
          </div>

          <div className="space-y-3">
            {dashData.latestAppointments.slice(0, 5).map((item) => {
              const visitStatusMeta = getVisitStatusMeta(item);

              return (
                <div key={item._id} className="flex flex-col gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center">
                  <img src={item.docData.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.docData.name}</p>
                      <StatusBadge tone={visitStatusMeta.tone}>{visitStatusMeta.label}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.userData.name} | {slotDateFormat(item.slotDate)} | {item.slotTime}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{visitStatusMeta.description}</p>
                  </div>
                  {canCancelAppointment(item) ? (
                    <button type="button" className="soft-button-secondary px-4 py-2" onClick={() => cancelAppointment(item._id)}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Operational focus</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">What needs attention now</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Completion rate</p>
              <p className="mt-3 text-4xl font-semibold">
                {insights?.operational?.totalAppointments
                  ? Math.round((insights.operational.completed / insights.operational.totalAppointments) * 100)
                  : 0}
                %
              </p>
              <p className="mt-2 text-sm text-slate-300">Measures how efficiently appointments move to close.</p>
            </div>
            <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">New patients</p>
              <p className="mt-3 text-4xl font-semibold text-amber-950">{insights?.patientGrowth?.newThisMonth || 0}</p>
              <p className="mt-2 text-sm text-amber-800/80">Fresh registrations this month.</p>
            </div>
            <div className="rounded-[24px] border border-sky-100 bg-sky-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">Checked in now</p>
              <p className="mt-3 text-4xl font-semibold text-sky-950">{insights?.operational?.checkedIn || 0}</p>
              <p className="mt-2 text-sm text-sky-800/80">Patients currently ready for consultation.</p>
            </div>
            <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-700">In consultation</p>
              <p className="mt-3 text-4xl font-semibold text-violet-950">{insights?.operational?.inConsultation || 0}</p>
              <p className="mt-2 text-sm text-violet-800/80">Visits that are actively in progress.</p>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
};

export default Dashboard;
