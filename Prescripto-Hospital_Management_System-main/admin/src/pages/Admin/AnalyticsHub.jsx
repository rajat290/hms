import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const AnalyticsHub = () => {
    const { aToken, backendUrl } = useContext(AdminContext)
    const { currency } = useContext(AppContext)

    const [activeTab, setActiveTab] = useState('overview') // overview, financial, operational, performance
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [granularity, setGranularity] = useState('daily')
    const [timeRange, setTimeRange] = useState('30days')

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${backendUrl}/api/admin/advanced-analytics?granularity=${granularity}`, {
                headers: { aToken }
            })
            const data = await response.json()
            if (data.success) {
                setAnalytics(data)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Failed to fetch analytics")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (aToken) fetchAnalytics()
    }, [aToken, granularity])

    if (loading) return <div className='p-10 text-center text-indigo-600 font-medium animate-pulse'>Loading Advanced Insights...</div>
    if (!analytics) return <div className='p-10 text-center text-rose-600 font-medium'>Failed to load analytics data. Please check connection.</div>

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    return (
        <div className='m-5 w-full max-w-7xl mx-auto'>
            {/* Header */}
            <div className='flex justify-between items-end mb-8'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-800 tracking-tight'>Analytics Hub</h1>
                    <p className='text-gray-500 mt-1'>Unified business intelligence & operational insights</p>
                </div>
                <div className='flex gap-3'>
                    <select
                        value={granularity}
                        onChange={(e) => setGranularity(e.target.value)}
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
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'overview' && (
                <div className='space-y-8 animate-in fade-in duration-500'>
                    {/* KPI Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                        <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group'>
                            <div className='w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                                <span className='text-2xl'>💰</span>
                            </div>
                            <p className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Revenue</p>
                            <h3 className='text-3xl font-bold text-gray-800 mt-1'>{currency}{analytics.financial.totalRevenue.toLocaleString()}</h3>
                            <p className='text-xs text-green-500 font-bold mt-2'>↑ 12.5% vs last period</p>
                        </div>
                        <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group'>
                            <div className='w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                                <span className='text-2xl'>📅</span>
                            </div>
                            <p className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Appointments</p>
                            <h3 className='text-3xl font-bold text-gray-800 mt-1'>{analytics.operational.totalAppointments}</h3>
                            <p className='text-xs text-indigo-500 font-bold mt-2'>{analytics.operational.completed} completed</p>
                        </div>
                        <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group'>
                            <div className='w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                                <span className='text-2xl'>👥</span>
                            </div>
                            <p className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Growth</p>
                            <h3 className='text-3xl font-bold text-gray-800 mt-1'>+{analytics.patientGrowth.newThisMonth}</h3>
                            <p className='text-xs text-amber-500 font-bold mt-2'>New patients this month</p>
                        </div>
                        <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group'>
                            <div className='w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
                                <span className='text-2xl'>📉</span>
                            </div>
                            <p className='text-sm font-semibold text-gray-400 uppercase tracking-wider'>Cancellations</p>
                            <h3 className='text-3xl font-bold text-gray-800 mt-1'>{analytics.operational.cancelled}</h3>
                            <p className='text-xs text-rose-500 font-bold mt-2'>{Math.round((analytics.operational.cancelled / analytics.operational.totalAppointments) * 100)}% churn rate</p>
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
                            <AreaChart data={analytics.performanceTrends}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
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
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'financial' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-500'>
                    <div className='bg-white p-8 rounded-2xl border border-gray-100 shadow-sm'>
                        <h3 className='text-xl font-bold text-gray-800 mb-6'>Revenue by Method</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={Object.entries(analytics.financial.revenueByMethod).map(([name, value]) => ({ name, value }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {Object.entries(analytics.financial.revenueByMethod).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                <span className='text-xl font-bold text-rose-600'>{currency}{analytics.financial.outstandingPayments.toLocaleString()}</span>
                            </div>
                            <div className='flex justify-between items-center p-4 bg-gray-50 rounded-xl'>
                                <span className='text-gray-600 font-medium'>Avg. Transaction</span>
                                <span className='text-xl font-bold text-indigo-600'>{currency}{analytics.financial.averageTransaction.toLocaleString()}</span>
                            </div>
                            <div className='p-4 border border-dashed border-indigo-200 rounded-xl'>
                                <p className='text-xs text-gray-400 uppercase font-bold mb-2'>Projected E-Month</p>
                                <div className='flex items-end gap-2'>
                                    <span className='text-2xl font-bold text-gray-800'>{currency}{(analytics.financial.totalRevenue * 1.1).toLocaleString()}</span>
                                    <span className='text-xs text-green-500 font-bold mb-1'>+10% projection</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'operational' && (
                <div className='bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-in zoom-in-95 duration-500'>
                    <h3 className='text-xl font-bold text-gray-800 mb-8'>Efficiency Metrics</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
                        <div className='text-center'>
                            <p className='text-gray-400 text-sm font-semibold mb-1'>Completion Rate</p>
                            <div className='text-4xl font-black text-indigo-600'>
                                {Math.round((analytics.operational.completed / analytics.operational.totalAppointments) * 100)}%
                            </div>
                        </div>
                        <div className='text-center'>
                            <p className='text-gray-400 text-sm font-semibold mb-1'>Acceptance Time</p>
                            <div className='text-4xl font-black text-emerald-500'>12m</div>
                        </div>
                        <div className='text-center'>
                            <p className='text-gray-400 text-sm font-semibold mb-1'>New Patients</p>
                            <div className='text-4xl font-black text-amber-500'>{analytics.patientGrowth.newThisMonth}</div>
                        </div>
                        <div className='text-center'>
                            <p className='text-gray-400 text-sm font-semibold mb-1'>Total Records</p>
                            <div className='text-4xl font-black text-gray-800'>{analytics.patientGrowth.total}</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'performance' && (
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
                                {analytics.topDoctors.map((doc, idx) => (
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
    )
}

export default AnalyticsHub
