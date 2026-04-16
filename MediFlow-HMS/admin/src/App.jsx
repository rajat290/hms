import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { StaffContext } from './context/StaffContext';
import { AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import EmailVerification from './pages/EmailVerification';
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import Patients from './pages/Admin/Patients';
import BillingPayments from './pages/Admin/BillingPayments';
import Settings from './pages/Admin/Settings';
import PatientDetails from './pages/Admin/PatientDetails';
import AnalyticsHub from './pages/Admin/AnalyticsHub';
import DoctorPaymentSettings from './pages/Admin/DoctorPaymentSettings';
import AddPatient from './pages/Admin/AddPatient';
import AddStaff from './pages/Admin/AddStaff';
import AllStaff from './pages/Admin/AllStaff';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorAvailability from './pages/Doctor/DoctorAvailability';
import StaffDashboard from './pages/Staff/StaffDashboard';
import StaffAppointments from './pages/Staff/StaffAppointments';
import StaffPatients from './pages/Staff/StaffPatients';
import StaffAddPatient from './pages/Staff/StaffAddPatient';
import StaffBilling from './pages/Staff/StaffBilling';
import StaffFollowUp from './pages/Staff/StaffFollowUp';
import StaffPatientProfile from './pages/Staff/StaffPatientProfile';
import StaffQueue from './pages/Staff/StaffQueue';
import StaffAnalytics from './pages/Staff/StaffAnalytics';

const App = () => {
  const navigate = useNavigate();
  const { dToken } = useContext(DoctorContext);
  const { aToken } = useContext(AdminContext);
  const { sToken } = useContext(StaffContext);
  const { isDarkMode } = useContext(AppContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const role = useMemo(() => {
    if (aToken) return 'admin';
    if (dToken) return 'doctor';
    if (sToken) return 'staff';
    return null;
  }, [aToken, dToken, sToken]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', Boolean(isDarkMode));
    localStorage.setItem('darkMode', Boolean(isDarkMode) ? 'true' : 'false');
  }, [isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!event.altKey) return;
      if (event.key === 'n') navigate('/staff-add-patient');
      if (event.key === 'b') navigate('/staff-billing');
      if (event.key === 'q') navigate('/staff-queue');
      if (event.key === 'd') navigate('/staff-dashboard');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (!role) {
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={2600}
          toastStyle={{ borderRadius: 18 }}
        />
        <Routes>
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </>
    );
  }

  return (
    <div className="backoffice-shell">
      <ToastContainer
        position="top-right"
        autoClose={2600}
        toastStyle={{ borderRadius: 18 }}
      />
      <Sidebar
        role={role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="backoffice-main min-h-screen lg:pl-[290px]">
        <Navbar role={role} onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="backoffice-main px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={aToken ? <Dashboard /> : dToken ? <DoctorDashboard /> : <StaffDashboard />} />
            <Route path="/admin-dashboard" element={<Dashboard />} />
            <Route path="/all-appointments" element={<AllAppointments />} />
            <Route path="/add-doctor" element={<AddDoctor />} />
            <Route path="/doctor-list" element={<DoctorsList />} />
            <Route path="/add-staff" element={<AddStaff />} />
            <Route path="/all-staff" element={<AllStaff />} />
            <Route path="/all-patients" element={<Patients />} />
            <Route path="/add-patient" element={<AddPatient />} />
            <Route path="/billing" element={<BillingPayments />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/patient-details/:userId" element={<PatientDetails />} />
            <Route path="/analytics" element={<AnalyticsHub />} />
            <Route path="/billing-analytics" element={<AnalyticsHub />} />
            <Route path="/payment-settings" element={<DoctorPaymentSettings />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor-appointments" element={<DoctorAppointments />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/doctor-availability" element={<DoctorAvailability />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/staff-appointments" element={<StaffAppointments />} />
            <Route path="/staff-patients" element={<StaffPatients />} />
            <Route path="/staff-add-patient" element={<StaffAddPatient />} />
            <Route path="/staff-billing" element={<StaffBilling />} />
            <Route path="/staff-follow-up" element={<StaffFollowUp />} />
            <Route path="/staff-patient-profile/:id" element={<StaffPatientProfile />} />
            <Route path="/staff-queue" element={<StaffQueue />} />
            <Route path="/staff-analytics" element={<StaffAnalytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
