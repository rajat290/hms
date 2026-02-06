import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { StaffContext } from '../../context/StaffContext'
import { AppContext } from '../../context/AppContext'

const StaffAppointments = () => {

    const { sToken, appointments, cancelAppointment, getAllAppointments, markAppointmentPaid, checkInAppointment } = useContext(StaffContext)
    const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("")
    const [doctorFilter, setDoctorFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    useEffect(() => {
        if (sToken) {
            getAllAppointments()
        }
    }, [sToken])

    // Get unique doctor names for filter
    const doctorNames = Array.from(new Set(appointments.map(app => app.docData.name)))

    // Filter and sort logic
    const filteredAppointments = appointments
        .filter(app =>
            (app.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.docData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                slotDateFormat(app.slotDate).toLowerCase().includes(searchTerm.toLowerCase())) &&
            (doctorFilter === "" || app.docData.name === doctorFilter) &&
            (statusFilter === "" || (statusFilter === "completed" ? app.isCompleted : statusFilter === "cancelled" ? app.cancelled : !app.cancelled && !app.isCompleted))
        )
        .sort((a, b) => {
            if (sortBy === "patient") return a.userData.name.localeCompare(b.userData.name)
            if (sortBy === "doctor") return a.docData.name.localeCompare(b.docData.name)
            if (sortBy === "date") return new Date(a.slotDate) - new Date(b.slotDate)
            return 0
        })

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            <h1 className='text-lg font-medium'>All Appointments</h1>
            <div className='flex flex-col sm:flex-row gap-4 my-4'>
                <input
                    type='text'
                    placeholder='Search by patient, doctor, or date...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='border px-3 py-2 rounded w-full sm:w-64'
                />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className='border px-3 py-2 rounded w-full sm:w-auto'>
                    <option value=''>Sort By</option>
                    <option value='patient'>Patient Name</option>
                    <option value='doctor'>Doctor Name</option>
                    <option value='date'>Date</option>
                </select>
                <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} className='border px-3 py-2 rounded w-full sm:w-auto'>
                    <option value=''>All Doctors</option>
                    {doctorNames.map((doc, idx) => (
                        <option key={idx} value={doc}>{doc}</option>
                    ))}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className='border px-3 py-2 rounded w-full sm:w-auto'>
                    <option value=''>All Status</option>
                    <option value='completed'>Completed</option>
                    <option value='cancelled'>Cancelled</option>
                    <option value='active'>Active</option>
                </select>
            </div>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                <div className='grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_2fr] gap-4 py-4 px-6 border-b bg-gray-50 font-semibold text-gray-600 text-sm hidden sm:grid'>
                    <p>#</p>
                    <p>Patient</p>
                    <p>Age</p>
                    <p>Date & Time</p>
                    <p>Doctor</p>
                    <p>Fees</p>
                    <p className='text-right'>Actions</p>
                </div>
                {filteredAppointments.map((item, index) => (
                    <div className='grid grid-cols-1 sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_2fr] gap-4 py-4 px-6 border-b items-center hover:bg-gray-50 transition-colors' key={index}>
                        <p className='max-sm:hidden text-gray-500 font-medium'>{index + 1}</p>
                        <div className='flex items-center gap-3'>
                            <img src={item.userData.image} className='w-10 h-10 rounded-full object-cover border border-gray-200' alt='' />
                            <div>
                                <p className='font-bold text-gray-800'>{item.userData.name}</p>
                                <p className='text-xs text-gray-500 sm:hidden'>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                            </div>
                        </div>
                        <p className='max-sm:hidden text-gray-600'>{calculateAge(item.userData.dob)}</p>
                        <div className='max-sm:hidden'>
                            <p className='text-gray-900 font-medium'>{slotDateFormat(item.slotDate)}</p>
                            <p className='text-xs text-indigo-600 font-semibold'>{item.slotTime}</p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <img src={item.docData.image} className='w-8 h-8 rounded-full bg-gray-100 border border-gray-200' alt='' />
                            <p className='text-sm text-gray-700'>{item.docData.name}</p>
                        </div>
                        <div className='font-medium text-gray-800'>
                            {currency}{item.amount}
                            {item.payment && <span className='ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800'>Paid</span>}
                        </div>

                        <div className='flex justify-end gap-2'>
                            {item.cancelled ? (
                                <span className='px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100'>Cancelled</span>
                            ) : item.isCompleted ? (
                                <span className='px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm font-medium border border-green-100'>Completed</span>
                            ) : (
                                <>
                                    {!item.payment && (
                                        <button
                                            onClick={() => window.location.href = '/staff-billing'} // Ideally navigate properly 
                                            title="Go to Billing"
                                            className='bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all'
                                        >
                                            💵 Pay
                                        </button>
                                    )}
                                    {/* Check-in Button */}
                                    {!item.isCheckedIn && (
                                        <button
                                            className='bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all'
                                            onClick={() => checkInAppointment(item._id)}
                                        >
                                            ✅ Check In
                                        </button>
                                    )}
                                    {item.isCheckedIn && (
                                        <span className='px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium border border-blue-100'>Checked In</span>
                                    )}
                                    <button
                                        onClick={() => cancelAppointment(item._id)}
                                        className='bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 border border-gray-200 hover:border-red-200 p-1.5 rounded-lg transition-all'
                                        title='Cancel'
                                    >
                                        <img className='w-4' src={assets.cancel_icon} alt='' />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default StaffAppointments
