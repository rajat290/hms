import React, { useContext, useEffect, useState } from 'react'
import { StaffContext } from '../../context/StaffContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const StaffAnalytics = () => {
    const { dashData, getDashData, appointments, sToken } = useContext(StaffContext)
    const { currency } = useContext(AppContext)

    useEffect(() => {
        if (sToken) getDashData()
    }, [sToken])

    return (
        <div className='m-5 max-w-6xl mx-auto'>
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-800'>Analytics Hub</h1>
                <p className='text-gray-500'>Performance overview and financial insights</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
                <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
                    <p className='text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2'>Avg Revenue / Patient</p>
                    <p className='text-2xl font-black text-gray-900'>{currency}{dashData ? (dashData.totalCollections / (dashData.appointments || 1)).toFixed(2) : 0}</p>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
                    <p className='text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2'>Total Collections</p>
                    <p className='text-2xl font-black text-indigo-600'>+{currency}{dashData?.totalCollections || 0}</p>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
                    <p className='text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2'>Staff Efficiency</p>
                    <p className='text-2xl font-black text-green-600'>High</p>
                </div>
                <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
                    <p className='text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2'>Patient Retention</p>
                    <p className='text-2xl font-black text-gray-900'>84%</p>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <div className='bg-white p-8 rounded-2xl shadow-sm border border-gray-100'>
                    <h3 className='font-bold text-gray-800 mb-6 flex items-center gap-2'>
                        📈 Revenue Trend (Today)
                    </h3>
                    <div className='h-48 flex items-end gap-2'>
                        {[40, 70, 45, 90, 65, 80, 50, 60, 100, 75, 40, 95].map((h, i) => (
                            <div key={i} className='flex-1 bg-indigo-100 rounded-t-lg hover:bg-indigo-500 transition-all cursor-help relative group' style={{ height: `${h}%` }}>
                                <div className='absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'>{h * 10}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='bg-white p-8 rounded-2xl shadow-sm border border-gray-100'>
                    <h3 className='font-bold text-gray-800 mb-6 flex items-center gap-2'>
                        🎯 Patient Breakdown
                    </h3>
                    <div className='space-y-4'>
                        <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-500'>Standard</span>
                            <div className='flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden'>
                                <div className='h-full bg-blue-500 w-[60%]'></div>
                            </div>
                            <span className='text-xs font-bold text-gray-700'>60%</span>
                        </div>
                        <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-500'>VIP</span>
                            <div className='flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden'>
                                <div className='h-full bg-amber-500 w-[15%]'></div>
                            </div>
                            <span className='text-xs font-bold text-gray-700'>15%</span>
                        </div>
                        <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-500'>High-risk</span>
                            <div className='flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden'>
                                <div className='h-full bg-red-500 w-[25%]'></div>
                            </div>
                            <span className='text-xs font-bold text-gray-700'>25%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StaffAnalytics
