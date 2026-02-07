import React from 'react'
import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
    return (
        <div id='speciality' className='flex flex-col items-center gap-4 py-16 text-secondary'>
            <h1 className='text-3xl font-bold'>Find by Speciality</h1>
            <p className='sm:w-1/3 text-center text-sm text-gray-500'>Simply browse through our top medical specialties and find the right expert for your needs.</p>
            <div className='flex sm:justify-center gap-6 pt-8 w-full overflow-x-scroll no-scrollbar'>
                {specialityData.slice(0, 6).map((item, index) => (
                    <Link to={`/doctors/${item.speciality}`} onClick={() => window.scrollTo(0, 0)} className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0 card-hover p-4 rounded-2xl transition-all duration-500' key={index}>
                        <img className='w-16 sm:w-20 mb-3 bg-blue-50 p-2 rounded-full' src={item.image} alt="" />
                        <p className='font-medium text-gray-700'>{item.speciality}</p>
                    </Link>
                ))}
            </div>
            <Link to='/doctors' onClick={() => window.scrollTo(0, 0)} className='mt-8 text-primary font-bold border-2 border-primary/20 px-8 py-2.5 rounded-full hover:bg-primary hover:text-white transition-all'>
                View All Doctors
            </Link>
        </div>
    )
}

export default SpecialityMenu