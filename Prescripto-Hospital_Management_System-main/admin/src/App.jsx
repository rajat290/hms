import React, { useContext, useEffect } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { StaffContext } from './context/StaffContext';
import { Route, Routes, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import Patients from './pages/Admin/Patients';
import BillingPayments from './pages/Admin/BillingPayments';
import Login from './pages/Login';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorAvailability from './pages/Doctor/DoctorAvailability';
import Settings from './pages/Admin/Settings';
import PatientDetails from './pages/Admin/PatientDetails';
import Analytics from './pages/Admin/Analytics';
import AnalyticsHub from './pages/Admin/AnalyticsHub';
import DoctorPaymentSettings from './pages/Admin/DoctorPaymentSettings';
import AddPatient from './pages/Admin/AddPatient';
import BillingAnalytics from './pages/Admin/BillingAnalytics';
import AddStaff from './pages/Admin/AddStaff';
import AllStaff from './pages/Admin/AllStaff';
import StaffDashboard from './pages/Staff/StaffDashboard';
import StaffAppointments from './pages/Staff/StaffAppointments';
import StaffPatients from './pages/Staff/StaffPatients';
import StaffAddPatient from './pages/Staff/StaffAddPatient';
import StaffBilling from './pages/Staff/StaffBilling';
import StaffFollowUp from './pages/Staff/StaffFollowUp';
import StaffPatientProfile from './pages/Staff/StaffPatientProfile';
import StaffQueue from './pages/Staff/StaffQueue';
import StaffAnalytics from './pages/Staff/StaffAnalytics';
import { AppContext } from './context/AppContext';
import EmailVerification from './pages/EmailVerification';

const App = () => {

  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)
  const { sToken } = useContext(StaffContext)
  const { isDarkMode } = useContext(AppContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }, [isDarkMode])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        if (e.key === 'n') navigate('/staff-add-patient')
        if (e.key === 'b') navigate('/staff-billing')
        if (e.key === 'q') navigate('/staff-queue')
        if (e.key === 'd') navigate('/staff-dashboard')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return dToken || aToken || sToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={
            aToken ? <Dashboard /> : (dToken ? <DoctorDashboard /> : (sToken ? <StaffDashboard /> : <Login />))
          } />
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='/all-appointments' element={<AllAppointments />} />
          <Route path='/add-doctor' element={<AddDoctor />} />
          <Route path='/doctor-list' element={<DoctorsList />} />
          <Route path='/add-staff' element={<AddStaff />} />
          <Route path='/all-staff' element={<AllStaff />} />
          <Route path='/all-patients' element={<Patients />} />
          <Route path='/add-patient' element={<AddPatient />} />
          <Route path='/billing' element={<BillingPayments />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/patient-details/:userId' element={<PatientDetails />} />
          <Route path='/analytics' element={<AnalyticsHub />} />
          <Route path='/billing-analytics' element={<AnalyticsHub />} />
          <Route path='/payment-settings' element={<DoctorPaymentSettings />} />
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/doctor-appointments' element={<DoctorAppointments />} />
          <Route path='/doctor-profile' element={<DoctorProfile />} />
          <Route path='/doctor-availability' element={<DoctorAvailability />} />
          <Route path='/staff-dashboard' element={<StaffDashboard />} />
          <Route path='/staff-appointments' element={<StaffAppointments />} />
          <Route path='/staff-patients' element={<StaffPatients />} />
          <Route path='/staff-add-patient' element={<StaffAddPatient />} />
          <Route path='/staff-billing' element={<StaffBilling />} />
          <Route path='/staff-follow-up' element={<StaffFollowUp />} />
          <Route path='/staff-patient-profile/:id' element={<StaffPatientProfile />} />
          <Route path='/staff-queue' element={<StaffQueue />} />
          <Route path='/staff-analytics' element={<StaffAnalytics />} />
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <ToastContainer />
      <Routes>
        <Route path='/verify-email' element={<EmailVerification />} />
        <Route path='*' element={<Login />} />
      </Routes>
    </>
  )
}

export default App
