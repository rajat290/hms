import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
const TopDoctors = () => {

    const navigate = useNavigate()

    const { doctors } = useContext(AppContext)

    return (
        <div className='flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10'>
            <h1 className='text-3xl font-medium'>Top Doctors to Book</h1>
            <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of trusted doctors.</p>
            <div className='w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-5 gap-y-8 px-3 sm:px-0'>
                {doctors.slice(0, 10).map((item, index) => (
                    <div onClick={() => { navigate(`/appointment/${item._id}`); window.scrollTo(0, 0) }} className='border border-gray-100 rounded-2xl overflow-hidden cursor-pointer bg-white card-hover group shadow-sm' key={index}>
                        <div className='relative overflow-hidden'>
                            <img className='bg-blue-50 group-hover:scale-105 transition-transform duration-700 w-full' src={item.image} alt="" />
                            <div className='absolute top-2 right-2 glass-effect py-1 px-2 rounded-full text-[8px] font-bold text-primary uppercase'>
                                {item.experience || '10+ Yrs'}
                            </div>
                        </div>
                        <div className='p-4'>
                            <div className={`flex items-center gap-2 text-[10px] font-semibold uppercase ${item.available ? 'text-green-500' : "text-gray-400"} mb-2`}>
                                <p className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-300"}`}></p>
                                <p>{item.available ? 'Available' : "Full"}</p>
                            </div>
                            <p className='text-secondary text-base font-bold group-hover:text-primary transition-colors truncate'>{item.name}</p>
                            <p className='text-gray-500 text-xs truncate'>{item.speciality}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => { navigate('/doctors'); window.scrollTo(0, 0) }} className='mt-10 px-10 py-3 bg-white border-2 border-primary/20 text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all shadow-sm'>
                View More Doctors
            </button>
        </div>

    )
}

export default TopDoctors