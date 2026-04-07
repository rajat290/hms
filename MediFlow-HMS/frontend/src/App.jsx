import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileCTA from './components/MobileCTA';
import AIChatWidget from './components/AIChatWidget';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import Appointment from './pages/Appointment';
import MyAppointments from './pages/MyAppointments';
import AppointmentDetails from './pages/AppointmentDetails';
import MyProfile from './pages/MyProfile';
import MyBilling from './pages/MyBilling';
import Notifications from './pages/Notifications';
import Verify from './pages/Verify';
import EmailVerification from './components/EmailVerification';
import PasswordReset from './components/PasswordReset';
import SymptomChecker from './components/SymptomChecker';
import SmartScheduler from './components/SmartScheduler';

const App = () => (
  <div className="site-shell">
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
    </div>

    <ScrollToTop />

    <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="light"
      toastClassName={() => 'rounded-[20px] border border-white/70 bg-white/95 shadow-soft'}
      bodyClassName={() => 'text-sm font-medium text-secondary'}
    />

    <Navbar />

    <main className="relative z-10 pb-28 sm:pb-12">
      <div className="page-wrap page-reveal">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:speciality" element={<Doctors />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/appointment/:docId" element={<Appointment />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/my-appointments/:appointmentId" element={<AppointmentDetails />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-billing" element={<MyBilling />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/symptom-checker" element={<SymptomChecker />} />
          <Route path="/smart-scheduler" element={<SmartScheduler />} />
        </Routes>
      </div>
    </main>

    <MobileCTA />
    <AIChatWidget />
    <Footer />
  </div>
);

export default App;
