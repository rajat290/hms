import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate, useLocation } from 'react-router-dom'

const MobileCTA = () => {
    const navigate = useNavigate()
    const location = useLocation()

    // Don't show on specific pages if necessary
    const isDoctorPage = location.pathname.includes('/doctors')
    const isAppointmentPage = location.pathname.includes('/appointment')

    return (
        <div className='sm:hidden h-0'>
            {/* Floating Call Button */}
            <a href='tel:+12124567890' className='fixed bottom-24 right-6 z-50 bg-success text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            </a>

            {/* Sticky Bottom Booking Button (Only if not already on booking-related pages potentially) */}
            {!isAppointmentPage && (
                <div className='fixed bottom-0 left-0 right-0 z-50 p-4 glass-effect border-t border-white/20'>
                    <button
                        onClick={() => { navigate('/doctors'); window.scrollTo(0, 0); }}
                        className='w-full bg-gradient-primary text-white py-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all'
                    >
                        Book Appointment Now
                    </button>
                </div>
            )}
        </div>
    )
}

export default MobileCTA
