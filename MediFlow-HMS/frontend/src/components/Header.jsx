import React from 'react'
import { assets } from '../assets/assets'

const Header = () => {
    return (
        <div className='flex flex-col md:flex-row flex-wrap bg-gradient-primary rounded-3xl px-6 md:px-10 lg:px-20 relative overflow-hidden'>

            {/* Background Accent */}
            <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl'></div>
            <div className='absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl'></div>

            {/* --------- Header Left --------- */}
            <div className='md:w-1/2 flex flex-col items-start justify-center gap-6 py-10 m-auto md:py-[8vw] md:mb-[-30px] relative z-10'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-tight'>
                        Book an Appointment <br /> at <span className='text-accent'>Mediflow Hospital</span>
                    </h1>
                    <p className='text-white/80 text-lg font-medium tracking-wide uppercase mt-1'>
                        Trusted Care • Same-Day Appointments • Easy Booking
                    </p>
                </div>

                <div className='flex flex-col md:flex-row items-center gap-4 text-white/90 text-base font-light'>
                    <img className='w-28 border-2 border-white/20 rounded-full p-1' src={assets.group_profiles} alt="" />
                    <p className='leading-relaxed'>Simply browse through our extensive list of trusted doctors, <br className='hidden sm:block' /> schedule your appointment hassle-free in minutes.</p>
                </div>

                <div className='flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto'>
                    <a href='#speciality' className='flex items-center justify-center gap-3 bg-white px-10 py-4 rounded-full text-primary font-bold text-base shadow-lg hover:bg-gray-50 hover:scale-105 transition-all duration-300 w-full sm:w-auto'>
                        Book Appointment
                    </a>
                    <a href='tel:+12124567890' className='flex items-center justify-center gap-3 bg-transparent border-2 border-white/30 px-10 py-4 rounded-full text-white font-bold text-base hover:bg-white/10 transition-all duration-300 w-full sm:w-auto'>
                        Call Hospital
                    </a>
                </div>

                {/* Trust micro-points */}
                <div className='flex flex-wrap items-center gap-6 text-white/80 text-sm font-medium mt-2'>
                    <div className='flex items-center gap-2'>
                        <span className='text-accent'>✔</span> Same-day appointments
                    </div>
                    <div className='flex items-center gap-2'>
                        <span className='text-accent'>✔</span> Verified doctors
                    </div>
                    <div className='flex items-center gap-2'>
                        <span className='text-accent'>✔</span> Secure patient data
                    </div>
                </div>
            </div>

            {/* --------- Header Right --------- */}
            <div className='md:w-1/2 relative flex justify-end'>
                <img className='w-full md:w-[90%] bottom-0 h-auto rounded-b-lg' src={assets.header_img} alt="" />
            </div>
        </div>
    )
}

export default Header