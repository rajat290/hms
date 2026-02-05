import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Analytics = () => {
    const { aToken, backendUrl } = useContext(AdminContext)
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            setError(null)
            const { data } = await axios.get(backendUrl + '/api/admin/analytics', { headers: { aToken } })
            console.log('Analytics response:', data)
            if (data.success) {
                setAnalytics(data)
            } else {
                setError(data.message || 'Failed to fetch analytics')
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Analytics error:', error)
            setError(error.message || 'Error fetching analytics')
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchAnalytics()
        }
    }, [aToken])

    if (loading) {
        return <div className='m-5'>Loading analytics...</div>
    }

    if (error) {
        return <div className='m-5 text-red-500'>Error: {error}</div>
    }

    if (!analytics) {
        return <div className='m-5'>No analytics data available</div>
    }

    // Prepare chart data
    const revenueChartData = analytics.revenueByDate.map(item => ({
        date: item._id,
        revenue: item.revenue,
        appointments: item.count
    }))

    const statusChartData = Object.entries(analytics.statusCounts).map(([name, value]) => ({
        name,
        value
    }))

    const COLORS = ['#FFA500', '#4CAF50', '#2196F3', '#F44336']

    return (
        <div className='m-5'>
            <p className='mb-6 text-xl font-medium'>Analytics Dashboard</p>

            {/* Key Metrics Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
                <div className='bg-white p-6 border rounded shadow-sm'>
                    <p className='text-sm text-gray-600'>Total Revenue</p>
                    <p className='text-3xl font-bold text-green-600'>₹{analytics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className='bg-white p-6 border rounded shadow-sm'>
                    <p className='text-sm text-gray-600'>This Month</p>
                    <p className='text-3xl font-bold text-blue-600'>₹{analytics.monthRevenue.toLocaleString()}</p>
                </div>
                <div className='bg-white p-6 border rounded shadow-sm'>
                    <p className='text-sm text-gray-600'>Total Appointments</p>
                    <p className='text-3xl font-bold text-purple-600'>{analytics.totalAppointments}</p>
                </div>
                <div className='bg-white p-6 border rounded shadow-sm'>
                    <p className='text-sm text-gray-600'>Completed Rate</p>
                    <p className='text-3xl font-bold text-indigo-600'>
                        {((analytics.statusCounts.Completed / analytics.totalAppointments) * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                {/* Revenue Chart */}
                <div className='bg-white p-6 border rounded shadow-sm'>
                    <p className='text-lg font-medium mb-4'>Revenue Trend (Last 30 Days)</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueChartData}>
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
                                data={statusChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Doctors */}
            <div className='bg-white p-6 border rounded shadow-sm'>
                <p className='text-lg font-medium mb-4'>Top Performing Doctors</p>
                <div className='space-y-4'>
                    {analytics.topDoctors.map((item, index) => (
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
                                <p className='font-bold text-green-600'>₹{item.revenue.toLocaleString()}</p>
                                <p className='text-sm text-gray-600'>{item.appointments} appointments</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Analytics
