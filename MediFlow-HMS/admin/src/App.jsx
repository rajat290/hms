import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
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

  const defaultRoute = useMemo(() => {
    if (aToken) return '/admin-dashboard';
    if (dToken) return '/doctor-dashboard';
    if (sToken) return '/staff-dashboard';
    return '/';
  }, [aToken, dToken, sToken]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', Boolean(isDarkMode));
    localStorage.setItem('darkMode', Boolean(isDarkMode) ? 'true' : 'false');
  }, [isDarkMode]);

  useEffect(() => {
    if (role !== 'staff') return undefined;

    const handleKeyDown = (event) => {
      if (!event.altKey) return;

      if (event.key === 'n') {
        event.preventDefault();
        navigate('/staff-add-patient');
      }

      if (event.key === 'b') {
        event.preventDefault();
        navigate('/staff-billing');
      }

      if (event.key === 'q') {
        event.preventDefault();
        navigate('/staff-queue');
      }

      if (event.key === 'd') {
        event.preventDefault();
        navigate('/staff-dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, role]);

  const renderRoleRoute = (allowedRoles, element) =>
    allowedRoles.includes(role) ? element : <Navigate to={defaultRoute} replace />;

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
      <div className="min-h-screen lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
        <Sidebar
          role={role}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="backoffice-main min-w-0">
          <Navbar role={role} onOpenSidebar={() => setIsSidebarOpen(true)} />
          <main className="backoffice-main min-w-0 px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Navigate to={defaultRoute} replace />} />
              <Route path="/admin-dashboard" element={renderRoleRoute(['admin'], <Dashboard />)} />
              <Route path="/all-appointments" element={renderRoleRoute(['admin'], <AllAppointments />)} />
              <Route path="/add-doctor" element={renderRoleRoute(['admin'], <AddDoctor />)} />
              <Route path="/doctor-list" element={renderRoleRoute(['admin'], <DoctorsList />)} />
              <Route path="/add-staff" element={renderRoleRoute(['admin'], <AddStaff />)} />
              <Route path="/all-staff" element={renderRoleRoute(['admin'], <AllStaff />)} />
              <Route path="/all-patients" element={renderRoleRoute(['admin'], <Patients />)} />
              <Route path="/add-patient" element={renderRoleRoute(['admin'], <AddPatient />)} />
              <Route path="/billing" element={renderRoleRoute(['admin'], <BillingPayments />)} />
              <Route path="/settings" element={renderRoleRoute(['admin'], <Settings />)} />
              <Route path="/patient-details/:userId" element={renderRoleRoute(['admin'], <PatientDetails />)} />
              <Route path="/analytics" element={renderRoleRoute(['admin'], <AnalyticsHub />)} />
              <Route path="/billing-analytics" element={renderRoleRoute(['admin'], <AnalyticsHub />)} />
              <Route path="/payment-settings" element={renderRoleRoute(['admin'], <DoctorPaymentSettings />)} />
              <Route path="/doctor-dashboard" element={renderRoleRoute(['doctor'], <DoctorDashboard />)} />
              <Route path="/doctor-appointments" element={renderRoleRoute(['doctor'], <DoctorAppointments />)} />
              <Route path="/doctor-profile" element={renderRoleRoute(['doctor'], <DoctorProfile />)} />
              <Route path="/doctor-availability" element={renderRoleRoute(['doctor'], <DoctorAvailability />)} />
              <Route path="/staff-dashboard" element={renderRoleRoute(['staff'], <StaffDashboard />)} />
              <Route path="/staff-appointments" element={renderRoleRoute(['staff'], <StaffAppointments />)} />
              <Route path="/staff-patients" element={renderRoleRoute(['staff'], <StaffPatients />)} />
              <Route path="/staff-add-patient" element={renderRoleRoute(['staff'], <StaffAddPatient />)} />
              <Route path="/staff-billing" element={renderRoleRoute(['staff'], <StaffBilling />)} />
              <Route path="/staff-follow-up" element={renderRoleRoute(['staff'], <StaffFollowUp />)} />
              <Route path="/staff-patient-profile/:id" element={renderRoleRoute(['staff'], <StaffPatientProfile />)} />
              <Route path="/staff-queue" element={renderRoleRoute(['staff'], <StaffQueue />)} />
              <Route path="/staff-analytics" element={renderRoleRoute(['staff'], <StaffAnalytics />)} />
              <Route path="*" element={<Navigate to={defaultRoute} replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
