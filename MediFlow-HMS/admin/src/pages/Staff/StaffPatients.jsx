import React, { useEffect, useContext, useState } from 'react'
import { assets } from '../../assets/assets.js'
import { StaffContext } from '../../context/StaffContext'
import { useNavigate } from 'react-router-dom'

const StaffPatients = () => {

    const { sToken, patients, getAllPatients } = useContext(StaffContext)
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (sToken) {
            getAllPatients().then(() => setLoading(false))
        }
    }, [sToken])

    const filteredPatients = patients.filter(pat =>
        pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pat.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pat.phone.includes(searchTerm)
    )

    return (
        <div className='m-5 max-w-6xl mx-auto'>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
                    <img src={assets.people_icon} className='w-8' alt="" /> Patient Records
                </h1>
                <button
                    onClick={() => navigate('/staff-add-patient')}
                    className='bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-indigo-700 transition-all flex items-center gap-2'
                >
                    <img src={assets.add_icon} className='w-4 invert' alt="" /> New Patient
                </button>
            </div>

            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                <div className='p-4 border-b bg-gray-50'>
                    <input
                        type='text'
                        placeholder='Search by Name, Phone or Email...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className='w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none'
                    />
                </div>

                {loading ? (
                    <div className='p-10 text-center text-gray-500'>Loading patients...</div>
                ) : filteredPatients.length === 0 ? (
                    <div className='p-10 text-center text-gray-500'>No patients found matching "{searchTerm}"</div>
                ) : (
                    <div className='divide-y divide-gray-100'>
                        {/* Header */}
                        <div className='grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr_2fr] gap-4 p-4 bg-gray-50 font-semibold text-gray-600 text-sm hidden sm:grid'>
                            <p>#</p>
                            <p>Patient Details</p>
                            <p>Contact</p>
                            <p>Location</p>
                            <p className='text-right'>Actions</p>
                        </div>

                        {/* Rows */}
                        {filteredPatients.map((item, index) => (
                            <div className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1.5fr_1.5fr_2fr] gap-4 p-4 items-center hover:bg-gray-50 transition-colors' key={index}>
                                <p className='max-sm:hidden text-gray-500 font-medium'>{index + 1}</p>
                                <div className='flex items-center gap-3'>
                                    <img className='w-10 h-10 rounded-full object-cover border border-gray-200' src={item.image} alt='' />
                                    <div>
                                        <p className='font-bold text-gray-800 flex items-center gap-2'>
                                            {item.name}
                                            {item.patientCategory !== 'Standard' && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.patientCategory === 'VIP' ? 'bg-amber-100 text-amber-700' :
                                                    item.patientCategory === 'High-risk' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {item.patientCategory}
                                                </span>
                                            )}
                                        </p>
                                        <p className='text-xs text-gray-500'>{item.dob === 'Not Selected' ? 'Age N/A' : item.dob}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-800 font-medium'>{item.phone}</p>
                                    <p className='text-xs text-gray-600 truncate max-w-[150px]'>{item.chronicConditions || 'No conditions'}</p>
                                </div>
                                <p className='text-sm text-gray-600 truncate'>
                                    {typeof item.address === 'object' ? (item.address.line1 || 'N/A') : item.address}
                                </p>
                                <div className='flex justify-end gap-2'>
                                    <button
                                        onClick={() => navigate('/staff-appointments')} // Ideal: Pre-select patient
                                        className='bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all'
                                    >
                                        📅 Book
                                    </button>
                                    <button
                                        onClick={() => navigate('/staff-billing')} // Ideal: Pre-select patient
                                        className='bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all'
                                    >
                                        💳 Bill
                                    </button>
                                    <button
                                        onClick={() => navigate(`/staff-patient-profile/${item._id}`)}
                                        className='bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all'
                                    >
                                        👁️ View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StaffPatients
