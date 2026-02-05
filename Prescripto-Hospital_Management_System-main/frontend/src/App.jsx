import React from 'react'
import Navbar from './components/Navbar'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import Appointment from './pages/Appointment'
import MyAppointments from './pages/MyAppointments'
import AppointmentDetails from './pages/AppointmentDetails'
import MyProfile from './pages/MyProfile'
import MyBilling from './pages/MyBilling'
import Notifications from './pages/Notifications'
import Footer from './components/Footer'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verify from './pages/Verify'
import EmailVerification from './components/EmailVerification'
import PasswordReset from './components/PasswordReset'
import SymptomChecker from './components/SymptomChecker'
import SmartScheduler from './components/SmartScheduler'

const App = () => {
  return (
    <div className='mx-4 sm:mx-[10%]'>
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />

        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/appointment/:docId' element={<Appointment />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/my-appointments/:appointmentId' element={<AppointmentDetails />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/my-billing' element={<MyBilling />} />
        <Route path='/notifications' element={<Notifications />} />
        <Route path='/verify' element={<Verify />} />
        <Route path='/verify-email' element={<EmailVerification />} />
        <Route path='/reset-password' element={<PasswordReset />} />
        <Route path='/symptom-checker' element={<SymptomChecker />} />
        <Route path='/smart-scheduler' element={<SmartScheduler />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App