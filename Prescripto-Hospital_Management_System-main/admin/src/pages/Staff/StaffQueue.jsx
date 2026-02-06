import React, { useContext, useEffect, useState } from 'react'
import { StaffContext } from '../../context/StaffContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'

const StaffQueue = () => {
    const { appointments, getAllAppointments, sToken, checkInAppointment } = useContext(StaffContext)
    const { slotDateFormat } = useContext(AppContext)
    const [queue, setQueue] = useState([])

    useEffect(() => {
        if (sToken) {
            getAllAppointments()
        }
    }, [sToken])

    useEffect(() => {
        // Filter for today's appointments that are either checked in or pending
        // For queue management, we focus on isCheckedIn = true and not completed
        const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '_')
        const activeQueue = appointments.filter(appt =>
            appt.slotDate === today &&
            !appt.cancelled &&
            !appt.isCompleted
        ).sort((a, b) => {
            if (a.isCheckedIn && !b.isCheckedIn) return -1
            if (!a.isCheckedIn && b.isCheckedIn) return 1
            return a.slotTime.localeCompare(b.slotTime)
        })
        setQueue(activeQueue)
    }, [appointments])

    return (
        <div className='m-5 max-w-6xl mx-auto'>
            <div className='flex justify-between items-center mb-8'>
                <h1 className='text-3xl font-bold text-gray-800 flex items-center gap-3'>
                    <img src={assets.list_icon} className='w-8' alt="" /> Clinic Queue
                </h1>
                <div className='flex gap-4'>
                    <div className='bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100'>
                        <p className='text-xs font-bold text-indigo-600 uppercase'>Currently Waiting</p>
                        <p className='text-xl font-black text-indigo-900'>{queue.filter(a => a.isCheckedIn).length}</p>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                <div className='grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1.5fr_1fr] gap-4 p-4 bg-gray-50 font-bold text-gray-600 text-sm border-b'>
                    <p>Pos</p>
                    <p>Patient</p>
                    <p>Doctor</p>
                    <p>Appt Time</p>
                    <p>Status</p>
                    <p className='text-right'>Actions</p>
                </div>

                <div className='divide-y divide-gray-50'>
                    {queue.length === 0 ? (
                        <div className='p-10 text-center text-gray-500'>
                            <p>No patients in queue for today.</p>
                        </div>
                    ) : queue.map((item, index) => (
                        <div key={item._id} className={`grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1.5fr_1fr] gap-4 p-4 items-center hover:bg-gray-50 transition-colors ${item.isCheckedIn ? 'bg-green-50/30' : ''}`}>
                            <p className='font-mono font-bold text-gray-400'>{index + 1}</p>
                            <div className='flex items-center gap-3'>
                                <img src={item.userData.image} className='w-10 h-10 rounded-full object-cover border border-gray-200' alt="" />
                                <div>
                                    <p className='font-bold text-gray-800'>{item.userData.name}</p>
                                    <p className='text-[10px] text-gray-500'>ID: {item._id.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>
                            <p className='text-sm text-gray-700 font-medium'>Dr. {item.docData.name}</p>
                            <p className='text-sm text-gray-700 font-medium'>{item.slotTime}</p>
                            <div>
                                {item.isCheckedIn ? (
                                    <span className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
                                        <span className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse'></span>
                                        Waiting
                                    </span>
                                ) : (
                                    <span className='px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold w-fit'>
                                        Scheduled
                                    </span>
                                )}
                            </div>
                            <div className='flex justify-end'>
                                {!item.isCheckedIn ? (
                                    <button
                                        onClick={() => checkInAppointment(item._id)}
                                        className='bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm'
                                    >
                                        Check In
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className='bg-gray-100 text-gray-400 px-4 py-1.5 rounded-lg text-xs font-bold cursor-not-allowed'
                                    >
                                        In Queue
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default StaffQueue
