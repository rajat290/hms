import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const PatientDetails = () => {
    const { userId } = useParams()
    const { aToken, backendUrl } = useContext(AdminContext)
    const navigate = useNavigate()

    const [patient, setPatient] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [financial, setFinancial] = useState({})
    const [prescriptions, setPrescriptions] = useState([])

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
    }

    const getPatientDetails = async () => {
        try {
            const { data } = await axios.get(backendUrl + `/api/admin/patient-details/${userId}`, { headers: { aToken } })
            if (data.success) {
                setPatient(data.patient)
                setAppointments(data.appointments)
                setFinancial(data.financial)
                setPrescriptions(data.prescriptions)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (aToken) {
            getPatientDetails()
        }
    }, [aToken])

    if (!patient) {
        return <div className='m-5'>Loading...</div>
    }

    return (
        <div className='m-5 max-w-6xl'>
            <button onClick={() => navigate('/all-patients')} className='mb-4 text-primary'>
                ← Back to Patients
            </button>

            {/* Patient Profile */}
            <div className='bg-white p-6 border rounded mb-6'>
                <p className='text-xl font-medium mb-4'>Patient Profile</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <p className='text-sm text-gray-500'>Name</p>
                        <p className='font-medium'>{patient.name}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-500'>Email</p>
                        <p className='font-medium'>{patient.email}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-500'>Phone</p>
                        <p className='font-medium'>{patient.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-500'>Gender</p>
                        <p className='font-medium'>{patient.gender || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-500'>Date of Birth</p>
                        <p className='font-medium'>{patient.dob || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='text-sm text-gray-500'>Address</p>
                        <p className='font-medium'>{patient.address?.line1 || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className='bg-white p-6 border rounded mb-6'>
                <p className='text-xl font-medium mb-4'>Financial Summary</p>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='bg-green-50 p-4 rounded'>
                        <p className='text-sm text-gray-600'>Total Spent</p>
                        <p className='text-2xl font-medium text-green-600'>₹{financial?.totalSpent || 0}</p>
                    </div>
                    <div className='bg-yellow-50 p-4 rounded'>
                        <p className='text-sm text-gray-600'>Pending Payments</p>
                        <p className='text-2xl font-medium text-yellow-600'>₹{financial?.pendingPayments || 0}</p>
                    </div>
                    <div className='bg-blue-50 p-4 rounded'>
                        <p className='text-sm text-gray-600'>Total Appointments</p>
                        <p className='text-2xl font-medium text-blue-600'>{financial?.totalAppointments || 0}</p>
                    </div>
                </div>
            </div>

            {/* Appointment History */}
            <div className='bg-white p-6 border rounded mb-6'>
                <p className='text-xl font-medium mb-4'>Appointment History</p>
                <div className='space-y-4'>
                    {appointments?.length > 0 ? appointments.map((item, index) => (
                        <div key={index} className='flex gap-4 border-b pb-4'>
                            <img className='w-16 h-16 bg-gray-100 rounded' src={item.docId?.image} alt="" />
                            <div className='flex-1'>
                                <p className='font-medium'>{item.docId?.name}</p>
                                <p className='text-sm text-gray-600'>{item.docId?.speciality}</p>
                                <p className='text-sm text-gray-500'>{slotDateFormat(item.slotDate)} | {item.slotTime}</p>
                                <div className='flex gap-2 mt-2'>
                                    {item.cancelled && <span className='text-xs bg-red-100 text-red-600 px-2 py-1 rounded'>Cancelled</span>}
                                    {item.isCompleted && <span className='text-xs bg-green-100 text-green-600 px-2 py-1 rounded'>Completed</span>}
                                    {item.isAccepted && !item.isCompleted && !item.cancelled && <span className='text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded'>Accepted</span>}
                                    {!item.isAccepted && !item.isCompleted && !item.cancelled && <span className='text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded'>Pending</span>}
                                </div>
                            </div>
                            <div className='text-right'>
                                <p className='font-medium'>₹{item.amount}</p>
                                {item.payment ? (
                                    <span className='text-xs text-green-600'>Paid</span>
                                ) : (
                                    <span className='text-xs text-red-600'>Unpaid</span>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className='text-gray-500'>No appointments found</p>
                    )}
                </div>
            </div>

            {/* Prescriptions */}
            {prescriptions?.length > 0 && (
                <div className='bg-white p-6 border rounded'>
                    <p className='text-xl font-medium mb-4'>Prescriptions</p>
                    <div className='space-y-3'>
                        {prescriptions.map((pres, index) => (
                            <div key={index} className='border-b pb-3'>
                                <p className='font-medium'>Prescription #{index + 1}</p>
                                <p className='text-sm text-gray-600'>{pres.medicines?.length || 0} medicines prescribed</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default PatientDetails
