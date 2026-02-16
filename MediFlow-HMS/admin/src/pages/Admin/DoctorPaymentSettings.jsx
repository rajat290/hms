import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const DoctorPaymentSettings = () => {
    const { aToken, backendUrl, doctors, getAllDoctors } = useContext(AdminContext)
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [paymentMethods, setPaymentMethods] = useState({ cash: true, online: true })

    useEffect(() => {
        if (aToken) {
            getAllDoctors()
        }
    }, [aToken])

    const handleSelectDoctor = (doctor) => {
        setSelectedDoc(doctor)
        setPaymentMethods(doctor.paymentMethods || { cash: true, online: true })
    }

    const updatePaymentMethods = async () => {
        if (!selectedDoc) {
            toast.error('Please select a doctor')
            return
        }

        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/update-payment-methods',
                { docId: selectedDoc._id, paymentMethods },
                { headers: { aToken } }
            )
            if (data.success) {
                toast.success('Payment methods updated')
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className='m-5'>
            <p className='mb-3 text-lg font-medium'>Doctor Payment Settings</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl'>
                <div className='mb-6'>
                    <label className='text-sm font-medium mb-2 block'>Select Doctor:</label>
                    <select
                        onChange={(e) => {
                            const doc = doctors.find(d => d._id === e.target.value)
                            if (doc) handleSelectDoctor(doc)
                        }}
                        className='border rounded px-3 py-2 w-full'
                    >
                        <option value="">Choose a doctor</option>
                        {doctors.map(doc => (
                            <option key={doc._id} value={doc._id}>{doc.name} - {doc.speciality}</option>
                        ))}
                    </select>
                </div>

                {selectedDoc && (
                    <>
                        <div className='mb-6'>
                            <p className='text-lg font-medium mb-4'>Available Payment Methods for {selectedDoc.name}:</p>
                            <div className='space-y-3'>
                                <label className='flex items-center gap-3'>
                                    <input
                                        type="checkbox"
                                        checked={paymentMethods.cash}
                                        onChange={(e) => setPaymentMethods({ ...paymentMethods, cash: e.target.checked })}
                                        className='w-5 h-5'
                                    />
                                    <span className='text-gray-700'>Allow Cash Payment (Pay at clinic)</span>
                                </label>
                                <label className='flex items-center gap-3'>
                                    <input
                                        type="checkbox"
                                        checked={paymentMethods.online}
                                        onChange={(e) => setPaymentMethods({ ...paymentMethods, online: e.target.checked })}
                                        className='w-5 h-5'
                                    />
                                    <span className='text-gray-700'>Allow Online Payment (Razorpay)</span>
                                </label>
                            </div>
                        </div>

                        {!paymentMethods.cash && !paymentMethods.online && (
                            <p className='text-red-500 text-sm mb-4'>⚠️ At least one payment method must be enabled</p>
                        )}

                        <button
                            onClick={updatePaymentMethods}
                            disabled={!paymentMethods.cash && !paymentMethods.online}
                            className='bg-primary text-white px-6 py-2 rounded disabled:bg-gray-400'
                        >
                            Update Payment Methods
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default DoctorPaymentSettings
