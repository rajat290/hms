import React from 'react'
import { assets } from '../assets/assets'

const Services = () => {
    const servicesList = [
        { title: 'General Health', desc: 'Comprehensive wellness checkups for all age groups.', icon: '🩺' },
        { title: 'Cardiology', desc: 'Specialized heart care and diagnostic testing.', icon: '❤️' },
        { title: 'Pediatrics', desc: 'Expert care for your children’s health and growth.', icon: '👶' },
        { title: 'Neurology', desc: 'Advanced treatment for brain and nervous system.', icon: '🧠' },
        { title: 'Emergency', desc: 'Round-the-clock rapid response for critical needs.', icon: '🚑' },
        { title: 'Diagnostics', desc: 'Accurate lab tests with fast and reliable reports.', icon: '🔬' },
    ]

    return (
        <div className='flex flex-col items-center gap-4 py-16 text-gray-800' id='services'>
            <h1 className='text-3xl font-bold text-secondary'>Our Medical Services</h1>
            <p className='sm:w-1/3 text-center text-sm text-gray-500 mb-8'>We offer a wide range of professional healthcare services designed to solve your medical problems effectively.</p>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 w-full px-4 sm:px-0'>
                {servicesList.map((service, index) => (
                    <div key={index} className='p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 bg-white card-hover cursor-pointer group'>
                        <div className='w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-blue-50/50 text-2xl sm:text-3xl rounded-xl sm:rounded-2xl mb-4 sm:mb-6 group-hover:bg-primary group-hover:text-white transition-all shadow-sm'>
                            {service.icon}
                        </div>
                        <h3 className='text-base sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors'>{service.title}</h3>
                        <p className='text-gray-500 text-[10px] sm:text-sm leading-relaxed'>{service.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Services
