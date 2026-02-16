import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {

  const { aToken, appointments, cancelAppointment, acceptAppointment, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("")
  const [doctorFilter, setDoctorFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

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
      <h1 className='text-lg font-medium'>All Appoinments </h1>
      -      <div className='flex flex-col sm:flex-row gap-4 my-4'>
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
      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {filteredAppointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt='' /> <p>{item.userData.name}</p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div className='flex items-center gap-2'>
              <img src={item.docData.image} className='w-8 rounded-full bg-gray-200' alt='' /> <p>{item.docData.name}</p>
            </div>
            <p>{currency}{item.amount}</p>
            {item.cancelled
              ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              : item.isCompleted
                ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                : (
                  <div className='flex items-center gap-2'>
                    <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt='' />
                    {!item.isAccepted && <button onClick={() => acceptAppointment(item._id)} className='text-xs border border-green-500 text-green-500 px-2 py-1 rounded hover:bg-green-500 hover:text-white transition-all'>Accept</button>}
                    {item.isAccepted && <p className='text-green-500 text-xs font-medium'>Accepted</p>}
                  </div>
                )
            }
          </div>
        ))}
      </div>
    </div>
  )
}
export default AllAppointments