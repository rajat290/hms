import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StaffContext } from '../../context/StaffContext'
import { assets } from '../../assets/assets'

const StaffPatientProfile = () => {
    const { id } = useParams()
    const { sToken, patients, getAllPatients, backendUrl } = useContext(StaffContext)
    const [patient, setPatient] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (patients.length === 0) {
            getAllPatients()
        }
    }, [sToken])

    useEffect(() => {
        const p = patients.find(pat => pat._id === id)
        if (p) setPatient(p)
    }, [id, patients])

    if (!patient) return <div className='p-10 text-center'>Loading patient profile...</div>

    return (
        <div className='m-5 max-w-5xl mx-auto'>
            <div className='flex items-center gap-4 mb-8'>
                <button onClick={() => navigate(-1)} className='p-2 hover:bg-gray-100 rounded-full transition-all'>
                    <img src={assets.arrow_icon} className='w-6 rotate-180' alt="" />
                </button>
                <h1 className='text-3xl font-bold text-gray-800'>Patient Profile</h1>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                {/* Left: Basic Info */}
                <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit'>
                    <div className='flex flex-col items-center text-center mb-6'>
                        <img src={patient.image} className='w-32 h-32 rounded-full object-cover border-4 border-indigo-50 shadow-md mb-4' alt="" />
                        <h2 className='text-2xl font-bold text-gray-900'>{patient.name}</h2>
                        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${patient.patientCategory === 'VIP' ? 'bg-amber-100 text-amber-700' :
                                patient.patientCategory === 'High-risk' ? 'bg-red-100 text-red-700' :
                                    'bg-indigo-100 text-indigo-700'
                            }`}>
                            {patient.patientCategory}
                        </span>
                    </div>

                    <div className='space-y-4 border-t pt-6'>
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Contact Details</p>
                            <p className='text-gray-800 font-medium mt-1'>{patient.phone}</p>
                            <p className='text-gray-500 text-sm'>{patient.email}</p>
                        </div>
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Personal Details</p>
                            <p className='text-gray-800 mt-1'>DOB: {patient.dob}</p>
                            <p className='text-gray-800'>Gender: {patient.gender}</p>
                        </div>
                        <div>
                            <p className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Emergency Contact</p>
                            {patient.emergencyContact ? (
                                <div className='mt-1'>
                                    <p className='text-gray-800 font-bold'>{patient.emergencyContact.name}</p>
                                    <p className='text-indigo-600 font-medium text-sm'>{patient.emergencyContact.phone}</p>
                                    <p className='text-gray-500 text-xs'>{patient.emergencyContact.relation}</p>
                                </div>
                            ) : <p className='text-gray-400 text-sm mt-1'>None specified</p>}
                        </div>
                    </div>
                </div>

                {/* Right: Medical Info */}
                <div className='md:col-span-2 space-y-8'>
                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
                        <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                            🩺 Medical Overview
                        </h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                            <div className='bg-red-50 p-4 rounded-xl border border-red-100'>
                                <p className='text-xs font-bold text-red-600 uppercase mb-1'>Allergies & Chronic Conditions</p>
                                <p className='text-gray-800 font-medium'>{patient.chronicConditions || 'No known allergies'}</p>
                            </div>
                            <div className='bg-blue-50 p-4 rounded-xl border border-blue-100'>
                                <p className='text-xs font-bold text-blue-600 uppercase mb-1'>Blood Group</p>
                                <p className='text-lg font-bold text-gray-800'>{patient.bloodGroup || 'Not set'}</p>
                            </div>
                        </div>
                    </div>

                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
                        <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                            📋 Medical History
                        </h3>
                        {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                            <div className='space-y-4'>
                                {patient.medicalHistory.map((item, index) => (
                                    <div key={index} className='p-4 border rounded-xl hover:bg-gray-50 transition-colors'>
                                        <div className='flex justify-between items-start'>
                                            <p className='font-bold text-gray-800'>{item.condition}</p>
                                            <p className='text-xs text-gray-400 font-medium'>{item.diagnosedDate}</p>
                                        </div>
                                        <p className='text-sm text-gray-600 mt-2'>{item.notes}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-10 bg-gray-50 rounded-xl border border-dashed'>
                                <p className='text-gray-500'>No medical history records found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StaffPatientProfile
