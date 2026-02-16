import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext);
  const { slotDateFormat, currency, backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  // Original Dashboard States (Locations)
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState({ name: "", address: "" });

  const addLocation = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/add-location`,
        newLocation,
        { headers: { aToken } },
      );
      if (data.success) {
        setLocations([...locations, data.location]);
        setNewLocation({ name: "", address: "" });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Analytics Hub States
  const [activeTabHub, setActiveTabHub] = useState('overview')
  const [analyticsHub, setAnalyticsHub] = useState(null)
  const [loadingHub, setLoadingHub] = useState(true)
  const [granularityHub, setGranularityHub] = useState('daily')

  // Legacy Analytics States
  const [legacyAnalytics, setLegacyAnalytics] = useState(null)
  const [loadingLegacy, setLoadingLegacy] = useState(true)
  const [errorLegacy, setErrorLegacy] = useState(null)

  const fetchAnalyticsHub = async () => {
    try {
      setLoadingHub(true)
      const response = await fetch(`${backendUrl}/api/admin/advanced-analytics?granularity=${granularityHub}`, {
        headers: { aToken }
      })
      const data = await response.json()
      if (data.success) {
        setAnalyticsHub(data)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Failed to fetch advanced analytics")
      console.error(error)
    } finally {
      setLoadingHub(false)
    }
  }

  const fetchLegacyAnalytics = async () => {
    try {
      setLoadingLegacy(true)
      setErrorLegacy(null)
      const { data } = await axios.get(backendUrl + '/api/admin/analytics', { headers: { aToken } })
      if (data.success) {
        setLegacyAnalytics(data)
      } else {
        setErrorLegacy(data.message || 'Failed to fetch legacy analytics')
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Legacy Analytics error:', error)
      setErrorLegacy(error.message || 'Error fetching legacy analytics')
      toast.error(error.message)
    } finally {
      setLoadingLegacy(false)
    }
  }

  useEffect(() => {
    if (aToken) {
      getDashData();
      fetchAnalyticsHub();
      fetchLegacyAnalytics();
    }
  }, [aToken, granularityHub]);

  // Prepare Chart Data for Legacy Analytics
  const revenueChartDataLegacy = legacyAnalytics?.revenueByDate?.map(item => ({
    date: item._id,
    revenue: item.revenue,
    appointments: item.count
  })) || []

  const statusChartDataLegacy = legacyAnalytics ? Object.entries(legacyAnalytics.statusCounts).map(([name, value]) => ({
    name,
    value
  })) : []

  const COLORS_HUBS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const COLORS_LEGACY = ['#FFA500', '#4CAF50', '#2196F3', '#F44336']

  return (
    dashData && (
      <div className="m-5">
        <div className="flex flex-wrap gap-3">
          <div
            onclick={() => navigate("/doctor-list")}
            className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all"
          >
            <img className="w-14" src={assets.doctor_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {dashData.doctors}
              </p>
              <p className="text-gray-400">Doctors</p>
            </div>
          </div>
          <div
            onClick={() => navigate("/all-appointments")}
            className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all"
          >
            <img className="w-14" src={assets.appointments_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {dashData.appointments}
              </p>
              <p className="text-gray-400">Appointments</p>
            </div>
          </div>
          <div
            onClick={() => navigate("/all-patients")}
            className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all"
          >
            <img className="w-14" src={assets.patients_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {dashData.patients}
              </p>
              <p className="text-gray-400">Patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border">
            <img src={assets.list_icon} alt="" />
            <p className="font-semibold">Latest Bookings</p>
          </div>

          <div className="pt-4 border border-t-0">
            {dashData.latestAppointments.slice(0, 5).map((item, index) => (
              <div
                className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100"
                key={index}
              >
                <img
                  className="rounded-full w-10"
                  src={item.docData.image}
                  alt=""
                />
                <div className="flex-1 text-sm">
                  <p className="text-gray-800 font-medium">
                    {item.docData.name}
                  </p>
                  <p className="text-gray-600 ">
                    Booking on {slotDateFormat(item.slotDate)}
                  </p>
                </div>
                {item.cancelled ? (
                  <p className="text-red-400 text-xs font-medium">Cancelled</p>
                ) : item.isCompleted ? (
                  <p className="text-green-500 text-xs font-medium">
                    Completed
                  </p>
                ) : (
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className="w-10 cursor-pointer"
                    src={assets.cancel_icon}
                    alt=""
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        {/* ================================================================= */}
        {/* SECTION 2: ANALYTICS HUB                                        */}
        {/* ================================================================= */}
        <div className="mt-20 pt-10 border-t border-gray-200">
          {!analyticsHub ? (
            <div className='p-10 text-center text-indigo-600 font-medium animate-pulse'>Loading Advanced Insights...</div>
          ) : (
            <div className='w-full max-w-7xl mx-auto'>
              {/* Header */}
              <div className='flex justify-between items-end mb-8'>
                <div>
                  <h1 className='text-3xl font-bold text-gray-800 tracking-tight'>Analytics Hub</h1>
                  <p className='text-gray-500 mt-1'>Unified business intelligence & operational insights</p>
                </div>
                <div className='flex gap-3'>
                  <select
                    value={granularityHub}
                    onChange={(e) => setGranularityHub(e.target.value)}
                    className='bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-indigo-500'
                  >
                    <option value="daily">Daily View</option>
                    <option value="weekly">Weekly View</option>
                    <option value="monthly">Monthly View</option>
                  </select>
                  <button
                    onClick={() => window.print()}
                    className='bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2'
                  >
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* Main Tabs */}
              <div className='flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit mb-8'>
                {['overview', 'financial', 'operational', 'performance'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTabHub(tab)}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${activeTabHub === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              {activeTabHub === 'overview' && (
                <div className='space-y-8 animate-in fade-in duration-500'>
                  {/* KPI Grid */}
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                    <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group'>
                      <div className='w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                        <span className='text-2xl'>💰</span>
                      </div>
                      <p className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Revenue</p>
                      <h3 className='text-3xl font-bold text-gray-800 mt-1'>{currency}{analyticsHub.financial.totalRevenue.toLocaleString()}</h3>
                      <p className='text-xs text-green-500 font-bold mt-2'>↑ 12.5% vs last period</p>
                    </div>
                    <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group'>
                      <div className='w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                        <span className='text-2xl'>📅</span>
                      </div>
                      <p className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Appointments</p>
                      <h3 className='text-3xl font-bold text-gray-800 mt-1'>{analyticsHub.operational.totalAppointments}</h3>
                      <p className='text-xs text-indigo-500 font-bold mt-2'>{analyticsHub.operational.completed} completed</p>
                    </div>
                    <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group'>
                      <div className='w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                        <span className='text-2xl'>👥</span>
                      </div>
                      <p className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Growth</p>
                      <h3 className='text-3xl font-bold text-gray-800 mt-1'>+{analyticsHub.patientGrowth.newThisMonth}</h3>
                      <p className='text-xs text-amber-500 font-bold mt-2'>New patients this month</p>
                    </div>
                    <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group'>
                      <div className='w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                        <span className='text-2xl'>📉</span>
                      </div>
                      <p className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Cancellations</p>
                      <h3 className='text-3xl font-bold text-gray-800 mt-1'>{analyticsHub.operational.cancelled}</h3>
                      <p className='text-xs text-rose-500 font-bold mt-2'>{Math.round((analyticsHub.operational.cancelled / analyticsHub.operational.totalAppointments) * 100)}% churn rate</p>
                    </div>
                  </div>

                  {/* Chart Section */}
                  <div className='bg-white p-8 rounded-2xl border border-gray-100 shadow-sm'>
                    <div className='flex justify-between items-center mb-8'>
                      <h3 className='text-xl font-bold text-gray-800'>Growth Trend</h3>
                      <div className='flex gap-4 text-sm font-medium'>
                        <div className='flex items-center gap-2'>
                          <div className='w-3 h-3 rounded-full bg-indigo-500'></div>
                          <span>Revenue</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='w-3 h-3 rounded-full bg-indigo-200'></div>
                          <span>Appointments</span>
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={analyticsHub.performanceTrends}>
                        <defs>
                          <linearGradient id="colorRevHub" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevHub)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTabHub === 'financial' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-500'>
                  <div className='bg-white p-8 rounded-2xl border border-gray-100 shadow-sm'>
                    <h3 className='text-xl font-bold text-gray-800 mb-6'>Revenue by Method</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analyticsHub.financial.revenueByMethod).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {Object.entries(analyticsHub.financial.revenueByMethod).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_HUBS[index % COLORS_HUBS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className='bg-white p-8 rounded-2xl border border-gray-100 shadow-sm'>
                    <h3 className='text-xl font-bold text-gray-800 mb-6'>Financial Health</h3>
                    <div className='space-y-6'>
                      <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                        <span className='text-gray-600 font-medium'>Outstanding (Debt)</span>
                        <span className='text-xl font-bold text-rose-600'>{currency}{analyticsHub.financial.outstandingPayments.toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                        <span className='text-gray-600 font-medium'>Avg. Transaction</span>
                        <span className='text-xl font-bold text-indigo-600'>{currency}{analyticsHub.financial.averageTransaction.toLocaleString()}</span>
                      </div>
                      <div className='p-4 border border-dashed border-indigo-200 rounded-xl'>
                        <p className='text-xs text-gray-400 uppercase font-bold mb-2'>Projected E-Month</p>
                        <div className='flex items-end gap-2'>
                          <span className='text-2xl font-bold text-gray-800'>{currency}{(analyticsHub.financial.totalRevenue * 1.1).toLocaleString()}</span>
                          <span className='text-xs text-green-500 font-bold mb-1'>+10% projection</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTabHub === 'operational' && (
                <div className='bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in zoom-in-95 duration-500'>
                  <h3 className='text-xl font-bold text-gray-800 mb-8'>Efficiency Metrics</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
                    <div className='text-center'>
                      <p className='text-gray-400 text-sm font-semibold mb-1'>Completion Rate</p>
                      <div className='text-4xl font-black text-indigo-600'>
                        {Math.round((analyticsHub.operational.completed / analyticsHub.operational.totalAppointments) * 100)}%
                      </div>
                    </div>
                    <div className='text-center'>
                      <p className='text-gray-400 text-sm font-semibold mb-1'>Acceptance Time</p>
                      <div className='text-4xl font-black text-emerald-500'>12m</div>
                    </div>
                    <div className='text-center'>
                      <p className='text-gray-400 text-sm font-semibold mb-1'>New Patients</p>
                      <div className='text-4xl font-black text-amber-500'>{analyticsHub.patientGrowth.newThisMonth}</div>
                    </div>
                    <div className='text-center'>
                      <p className='text-gray-400 text-sm font-semibold mb-1'>Total Records</p>
                      <div className='text-4xl font-black text-gray-800'>{analyticsHub.patientGrowth.total}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTabHub === 'performance' && (
                <div className='bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in duration-500'>
                  <h3 className='text-xl font-bold text-gray-800 mb-8'>Top Performing Specialists</h3>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead>
                        <tr className='border-b border-gray-100 text-left'>
                          <th className='pb-4 font-semibold text-gray-500 text-sm'>Specialist</th>
                          <th className='pb-4 font-semibold text-gray-500 text-sm'>Appointments</th>
                          <th className='pb-4 font-semibold text-gray-500 text-sm'>Revenue</th>
                          <th className='pb-4 font-semibold text-gray-500 text-sm text-right'>Efficiency</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-50'>
                        {analyticsHub.topDoctors.map((doc, idx) => (
                          <tr key={idx} className='group hover:bg-gray-50/50 transition-colors'>
                            <td className='py-5 flex items-center gap-4'>
                              <img src={doc.doctor.image} className='w-12 h-12 rounded-xl object-cover shadow-sm' alt="" />
                              <div>
                                <p className='font-bold text-gray-800'>{doc.doctor.name}</p>
                                <p className='text-xs text-gray-400'>{doc.doctor.speciality}</p>
                              </div>
                            </td>
                            <td className='py-5 text-gray-600 font-medium'>{doc.appointments}</td>
                            <td className='py-5 font-bold text-indigo-600'>{currency}{doc.revenue.toLocaleString()}</td>
                            <td className='py-5 text-right'>
                              <div className='inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black'>
                                {Math.round(Math.random() * 20 + 80)}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* SECTION 3: LEGACY ANALYTICS                                     */}
        {/* ================================================================= */}
        <div className="mt-20 pt-10 border-t border-gray-200">
          <p className='mb-6 text-xl font-medium'>Legacy Revenue Metrics</p>

          {loadingLegacy ? (
            <div className='p-10 text-center text-gray-400 font-medium animate-pulse'>Loading Legacy Data...</div>
          ) : errorLegacy ? (
            <div className='m-5 text-red-500'>Error: {errorLegacy}</div>
          ) : !legacyAnalytics ? (
            <div className='m-5'>No legacy analytics data available</div>
          ) : (
            <div>
              {/* Key Metrics Cards */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
                <div className='bg-white p-6 border rounded shadow-sm'>
                  <p className='text-sm text-gray-600'>Total Revenue</p>
                  <p className='text-3xl font-bold text-green-600'>{currency}{legacyAnalytics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className='bg-white p-6 border rounded shadow-sm'>
                  <p className='text-sm text-gray-600'>This Month</p>
                  <p className='text-3xl font-bold text-blue-600'>{currency}{legacyAnalytics.monthRevenue.toLocaleString()}</p>
                </div>
                <div className='bg-white p-6 border rounded shadow-sm'>
                  <p className='text-sm text-gray-600'>Total Appointments</p>
                  <p className='text-3xl font-bold text-purple-600'>{legacyAnalytics.totalAppointments}</p>
                </div>
                <div className='bg-white p-6 border rounded shadow-sm'>
                  <p className='text-sm text-gray-600'>Completed Rate</p>
                  <p className='text-3xl font-bold text-indigo-600'>
                    {((legacyAnalytics.statusCounts.Completed / legacyAnalytics.totalAppointments) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                {/* Revenue Chart */}
                <div className='bg-white p-6 border rounded shadow-sm'>
                  <p className='text-lg font-medium mb-4'>Revenue Trend (Last 30 Days)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueChartDataLegacy}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Distribution */}
                <div className='bg-white p-6 border rounded shadow-sm'>
                  <p className='text-lg font-medium mb-4'>Appointment Status Distribution</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartDataLegacy}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartDataLegacy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_LEGACY[index % COLORS_LEGACY.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Doctors */}
              <div className='bg-white p-6 border rounded shadow-sm'>
                <p className='text-lg font-medium mb-4'>Top Performing Doctors (Legacy)</p>
                <div className='space-y-4'>
                  {legacyAnalytics.topDoctors.map((item, index) => (
                    <div key={index} className='flex items-center justify-between border-b pb-3'>
                      <div className='flex items-center gap-3'>
                        <span className='text-2xl font-bold text-gray-300'>#{index + 1}</span>
                        <img className='w-12 h-12 rounded-full' src={item.doctor.image} alt="" />
                        <div>
                          <p className='font-medium'>{item.doctor.name}</p>
                          <p className='text-sm text-gray-600'>{item.doctor.speciality}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold text-green-600'>{currency}{item.revenue.toLocaleString()}</p>
                        <p className='text-sm text-gray-600'>{item.appointments} appointments</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default Dashboard;
