import React from 'react'
import { assets } from '../assets/assets'

const PaymentKPIs = ({ kpis, currency }) => {
    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            <div className='bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow'>
                <div className='w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center'>
                    <img className='w-6' src={assets.appointments_icon} alt="" />
                </div>
                <div>
                    <p className='text-2xl font-bold text-gray-800'>{currency}{kpis?.pendingPayments?.toLocaleString() || 0}</p>
                    <p className='text-sm text-gray-500'>Pending Payments</p>
                </div>
            </div>

            <div className='bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow'>
                <div className='w-12 h-12 bg-green-50 rounded-full flex items-center justify-center'>
                    <img className='w-6' src={assets.patients_icon} alt="" />
                </div>
                <div>
                    <p className='text-2xl font-bold text-gray-800'>{currency}{kpis?.todayRevenue?.toLocaleString() || 0}</p>
                    <p className='text-sm text-gray-500'>Today's Revenue</p>
                </div>
            </div>

            <div className='bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow'>
                <div className='w-12 h-12 bg-red-50 rounded-full flex items-center justify-center'>
                    <img className='w-6' src={assets.appointments_icon} alt="" />
                </div>
                <div>
                    <p className='text-2xl font-bold text-gray-800'>{kpis?.overdueInvoices || 0}</p>
                    <p className='text-sm text-gray-500'>Overdue Invoices</p>
                </div>
            </div>

            <div className='bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow'>
                <div className='w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center'>
                    <img className='w-6' src={assets.list_icon} alt="" />
                </div>
                <div>
                    <p className='text-2xl font-bold text-gray-800'>{kpis?.paymentSuccessRate || 0}%</p>
                    <p className='text-sm text-gray-500'>Success Rate</p>
                </div>
            </div>
        </div>
    )
}

export default PaymentKPIs
