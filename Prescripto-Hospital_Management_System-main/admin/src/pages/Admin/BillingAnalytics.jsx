import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { Bar, Line, Pie } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
)

const BillingAnalytics = () => {
    const { aToken, backendUrl } = useContext(AdminContext)
    const { currency } = useContext(AppContext)
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (aToken) {
            fetchAnalytics()
        }
    }, [aToken])

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/billing-analytics`, {
                headers: { aToken }
            })
            const data = await response.json()
            if (data.success) {
                setAnalytics(data)
            }
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className='m-5'><p>Loading analytics...</p></div>
    }

    if (!analytics) {
        return <div className='m-5'><p>Unable to load analytics data</p></div>
    }

    // Revenue Trends Chart
    const revenueTrendsData = {
        labels: analytics.revenueTrends.labels,
        datasets: [{
            label: 'Revenue',
            data: analytics.revenueTrends.data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
        }]
    }

    // Payment Methods Distribution
    const paymentMethodsData = {
        labels: analytics.paymentMethods.labels,
        datasets: [{
            data: analytics.paymentMethods.data,
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)'
            ],
            borderWidth: 1
        }]
    }

    // Monthly Revenue Comparison
    const monthlyRevenueData = {
        labels: analytics.monthlyRevenue.labels,
        datasets: [{
            label: 'This Year',
            data: analytics.monthlyRevenue.currentYear,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
        }, {
            label: 'Last Year',
            data: analytics.monthlyRevenue.lastYear,
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
        }]
    }

    return (
        <div className='m-5'>
            <p className='mb-3 text-lg font-medium'>Billing Analytics</p>

            {/* KPI Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-white p-4 rounded border'>
                    <p className='text-sm text-gray-600'>Total Revenue (This Month)</p>
                    <p className='text-2xl font-bold text-green-600'>{currency}{analytics.kpis.totalRevenueThisMonth}</p>
                </div>
                <div className='bg-white p-4 rounded border'>
                    <p className='text-sm text-gray-600'>Outstanding Payments</p>
                    <p className='text-2xl font-bold text-red-600'>{currency}{analytics.kpis.outstandingPayments}</p>
                </div>
                <div className='bg-white p-4 rounded border'>
                    <p className='text-sm text-gray-600'>Average Transaction</p>
                    <p className='text-2xl font-bold text-blue-600'>{currency}{analytics.kpis.averageTransaction}</p>
                </div>
                <div className='bg-white p-4 rounded border'>
                    <p className='text-sm text-gray-600'>Payment Success Rate</p>
                    <p className='text-2xl font-bold text-purple-600'>{analytics.kpis.paymentSuccessRate}%</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Revenue Trends */}
                <div className='bg-white p-4 rounded border'>
                    <h3 className='text-lg font-medium mb-4'>Revenue Trends</h3>
                    <Line
                        data={revenueTrendsData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'top' },
                                title: { display: false }
                            }
                        }}
                    />
                </div>

                {/* Payment Methods Distribution */}
                <div className='bg-white p-4 rounded border'>
                    <h3 className='text-lg font-medium mb-4'>Payment Methods Distribution</h3>
                    <Pie
                        data={paymentMethodsData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'bottom' }
                            }
                        }}
                    />
                </div>

                {/* Monthly Revenue Comparison */}
                <div className='bg-white p-4 rounded border lg:col-span-2'>
                    <h3 className='text-lg font-medium mb-4'>Monthly Revenue Comparison</h3>
                    <Bar
                        data={monthlyRevenueData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'top' },
                                title: { display: false }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return currency + value
                                        }
                                    }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Additional Metrics */}
            <div className='mt-6 bg-white p-4 rounded border'>
                <h3 className='text-lg font-medium mb-4'>Additional Metrics</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                        <p className='text-sm text-gray-600'>Total Invoices Generated</p>
                        <p className='text-xl font-semibold'>{analytics.additionalMetrics.totalInvoices}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-600'>Paid Invoices</p>
                        <p className='text-xl font-semibold text-green-600'>{analytics.additionalMetrics.paidInvoices}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-600'>Overdue Invoices</p>
                        <p className='text-xl font-semibold text-red-600'>{analytics.additionalMetrics.overdueInvoices}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BillingAnalytics
