import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { StaffContext } from '../context/StaffContext'

const Sidebar = () => {

  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)
  const { sToken } = useContext(StaffContext)

  return (
    <div className='min-h-screen bg-white border-r'>
      {aToken && <ul className='text-[#515151] mt-5'>

        <NavLink to={'/admin-dashboard'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Admin Dashboard">
          <img className='min-w-5' src={assets.home_icon} alt='Dashboard Icon' />
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>
        <NavLink to={'/all-appointments'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="All Appointments">
          <img className='min-w-5' src={assets.appointment_icon} alt='Appointments Icon' />
          <p className='hidden md:block'>Appointments</p>
        </NavLink>
        <NavLink to={'/add-doctor'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Add New Doctor">
          <img className='min-w-5' src={assets.add_icon} alt='Add Icon' />
          <p className='hidden md:block'>Add Doctor</p>
        </NavLink>
        <NavLink to={'/add-patient'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Add New Patient">
          <img className='min-w-5' src={assets.add_icon} alt='Add Icon' />
          <p className='hidden md:block'>Add Patient</p>
        </NavLink>
        <NavLink to={'/doctor-list'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Doctors List">
          <img className='min-w-5' src={assets.people_icon} alt='Doctors Icon' />
          <p className='hidden md:block'>Doctors List</p>
        </NavLink>
        <NavLink to={'/add-staff'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Add New Staff">
          <img className='min-w-5' src={assets.add_icon} alt='Add Icon' />
          <p className='hidden md:block'>Add Staff</p>
        </NavLink>
        <NavLink to={'/all-staff'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Staff List">
          <img className='min-w-5' src={assets.people_icon} alt='Staff Icon' />
          <p className='hidden md:block'>Staff List</p>
        </NavLink>
        <NavLink to={'/all-patients'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Patients List">
          <img className='min-w-5' src={assets.people_icon} alt='Patients Icon' />
          <p className='hidden md:block'>Patients</p>
        </NavLink>
        <NavLink to={'/billing'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Billing and Payments">
          <img className='min-w-5' src={assets.appointment_icon} alt='Billing Icon' />
          <p className='hidden md:block'>Billing/Payments</p>
        </NavLink>
        <NavLink to={'/settings'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Settings">
          <img className='min-w-5' src={assets.info_icon} alt='Settings Icon' />
          <p className='hidden md:block'>Settings</p>
        </NavLink>
        <NavLink to={'/payment-settings'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Payment Settings">
          <img className='min-w-5' src={assets.earning_icon} alt='Payments Icon' />
          <p className='hidden md:block'>Payment Settings</p>
        </NavLink>
      </ul>}

      {sToken && <ul className='text-[#515151] mt-5'>
        <NavLink to={'/staff-dashboard'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Staff Dashboard">
          <img className='min-w-5' src={assets.home_icon} alt='Dashboard Icon' />
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>
        <NavLink to={'/staff-appointments'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Staff Appointments">
          <img className='min-w-5' src={assets.appointment_icon} alt='Appointments Icon' />
          <p className='hidden md:block'>Appointments</p>
        </NavLink>
        <NavLink to={'/staff-patients'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Patients Management">
          <img className='min-w-5' src={assets.people_icon} alt='Patients Icon' />
          <p className='hidden md:block'>Patients</p>
        </NavLink>
        <NavLink to={'/staff-queue'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Queue Management">
          <img className='min-w-5' src={assets.list_icon} alt='Queue Icon' />
          <p className='hidden md:block'>Queue Management</p>
        </NavLink>
        <NavLink to={'/staff-billing'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Staff Billing Cockpit">
          <img className='min-w-5' src={assets.earning_icon} alt='Billing Icon' />
          <p className='hidden md:block'>Billing</p>
        </NavLink>
        <NavLink to={'/staff-analytics'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Staff Analytics Hub">
          <img className='min-w-5' src={assets.earning_icon} alt='Analytics Icon' />
          <p className='hidden md:block'>Analytics</p>
        </NavLink>
        <NavLink to={'/staff-follow-up'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Patient Follow-ups">
          <img className='min-w-5' src={assets.info_icon} alt='Follow-up Icon' />
          <p className='hidden md:block'>Follow-up</p>
        </NavLink>
      </ul>}

      {dToken && <ul className='text-[#515151] mt-5'>
        <NavLink to={'/doctor-dashboard'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Doctor Dashboard">
          <img className='min-w-5' src={assets.home_icon} alt='Dashboard Icon' />
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>
        <NavLink to={'/doctor-appointments'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Doctor Appointments">
          <img className='min-w-5' src={assets.appointment_icon} alt='Appointments Icon' />
          <p className='hidden md:block'>Appointments</p>
        </NavLink>
        <NavLink to={'/doctor-profile'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Doctor Profile">
          <img className='min-w-5' src={assets.people_icon} alt='Profile Icon' />
          <p className='hidden md:block'>Profile</p>
        </NavLink>
        <NavLink to={'/doctor-availability'} className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} aria-label="Doctor Availability Settings">
          <img className='min-w-5' src={assets.appointment_icon} alt='Availability Icon' />
          <p className='hidden md:block'>Availability</p>
        </NavLink>
      </ul>}
    </div >
  )
}

export default Sidebar
