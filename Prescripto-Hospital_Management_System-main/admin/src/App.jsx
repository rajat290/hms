import React, { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { Route, Routes } from 'react-router-dom'
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

const App = () => {

  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)

  return dToken || aToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='/all-appointments' element={<AllAppointments />} />
          <Route path='/add-doctor' element={<AddDoctor />} />
          <Route path='/doctor-list' element={<DoctorsList />} />
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
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <ToastContainer />
      <Login />
    </>
  )
}

export default App
