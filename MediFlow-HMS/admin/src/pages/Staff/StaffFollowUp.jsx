import React, { useContext } from 'react'
import { StaffContext } from '../../context/StaffContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const StaffFollowUp = () => {
    const { appointments, patients } = useContext(StaffContext)
    const { slotDateFormat, calculateAge } = useContext(AppContext)

    // Helper: Determine if an appointment is "Upcoming" (Today or Future)
    const isUpcoming = (slotDate) => {
        // Simple string comparison for dd_mm_yyyy might be risky if not parsed, 
        // but assuming standard format or consistent API. 
        // Better to use actual Date objects for robustness.

        // Mocking: Assuming all non-cancelled, non-completed appointments are "Active"
        return true
    }

    const upcomingAppts = appointments.filter(a => !a.cancelled && !a.isCompleted)

    const sendReminder = (phone, name, date, time) => {
        const message = `Hello ${name}, this is a reminder for your appointment at Mediflow on ${date} at ${time}. Please arrive 10 mins early.`
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    return (
        <div className='m-5'>
            <h1 className='text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2'>
                <img src={assets.info_icon} className='w-8' alt="" /> Follow-ups & Reminders
            </h1>

            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                <div className='grid grid-cols-[2fr_1fr_2fr_1fr] bg-gray-50 p-4 border-b font-medium text-gray-600'>
                    <p>Patient</p>
                    <p>Date & Time</p>
                    <p>Doctor</p>
                    <p className='text-center'>Action</p>
                </div>

                {upcomingAppts.length === 0 ? (
                    <div className='p-8 text-center text-gray-500'>No upcoming appointments found.</div>
                ) : (
                    upcomingAppts.map((item) => (
                        <div key={item._id} className='grid grid-cols-[2fr_1fr_2fr_1fr] p-4 border-b items-center hover:bg-gray-50'>
                            <div className='flex items-center gap-3'>
                                <img className='w-10 h-10 rounded-full object-cover' src={item.userData.image} alt="" />
                                <div>
                                    <p className='font-bold text-gray-800'>{item.userData.name}</p>
                                    <p className='text-xs text-gray-500'>Phone: {item.userData.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <p className='text-indigo-600 font-medium'>{slotDateFormat(item.slotDate)}</p>
                                <p className='text-xs text-gray-500'>{item.slotTime}</p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <img className='w-8 h-8 rounded-full bg-gray-100' src={item.docData.image} alt="" />
                                <p className='text-sm text-gray-700'>{item.docData.name}</p>
                            </div>
                            <div className='text-center'>
                                <button
                                    onClick={() => sendReminder(item.userData.phone, item.userData.name, item.slotDate, item.slotTime)}
                                    className='bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1 justify-center mx-auto'
                                >
                                    <span>🔔</span> Send Reminder
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default StaffFollowUp
