import React, { useContext, useState } from 'react'
import { StaffContext } from '../../context/StaffContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'

const StaffBilling = () => {
    const { appointments, updatePayment, patients } = useContext(StaffContext)
    const { slotDateFormat, currency } = useContext(AppContext)

    const [selectedAppt, setSelectedAppt] = useState(null)
    const [step, setStep] = useState(1) // 1: Select, 2: Review, 3: Payment
    const [search, setSearch] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('Cash')

    // Filter appointments (showing today's or unpaid/all)
    const filteredAppts = appointments.filter(a =>
        (a.userData.name.toLowerCase().includes(search.toLowerCase()) ||
            a._id.includes(search)) &&
        !a.cancelled
    )

    const handlePayment = async () => {
        if (!selectedAppt) return
        await updatePayment(selectedAppt._id, 'paid', paymentMethod)
        setStep(1)
        setSelectedAppt(null)
        toast.success("Payment Recorded Successfully")
    }

    return (
        <div className='m-5 max-w-4xl mx-auto'>
            <h1 className='text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2'>
                <img src={assets.earning_icon} className='w-8' alt="" /> Billing Counter
            </h1>

            <div className='flex gap-6 items-start'>
                {/* Left Panel: List */}
                <div className='flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                    <div className='p-4 border-b bg-gray-50'>
                        <input
                            type="text"
                            placeholder='Search Patient or Appt ID...'
                            className='w-full border rounded-lg px-3 py-2 outline-indigo-500'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className='max-h-[60vh] overflow-y-auto'>
                        {filteredAppts.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => { setSelectedAppt(item); setStep(2); }}
                                className={`p-4 border-b cursor-pointer hover:bg-indigo-50 transition-colors ${selectedAppt?._id === item._id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                            >
                                <div className='flex justify-between items-start'>
                                    <div>
                                        <p className='font-semibold text-gray-800'>{item.userData.name}</p>
                                        <p className='text-xs text-gray-500'>{slotDateFormat(item.slotDate)} • {item.slotTime}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                                    </span>
                                </div>
                                <p className='text-xs text-gray-400 mt-1'>Doc: {item.docData.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Action */}
                <div className='flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]'>
                    {!selectedAppt ? (
                        <div className='h-full flex flex-col items-center justify-center text-gray-400'>
                            <img src={assets.earning_icon} className='w-16 opacity-20 mb-4' alt="" />
                            <p>Select a patient to start billing</p>
                        </div>
                    ) : (
                        <div>
                            <div className='flex justify-between items-center mb-6 pb-4 border-b'>
                                <div>
                                    <p className='text-sm text-gray-500 uppercase font-bold tracking-wider'>Invoice For</p>
                                    <p className='text-xl font-bold text-indigo-700'>{selectedAppt.userData.name}</p>
                                </div>
                                <div className='text-right'>
                                    <p className='text-sm text-gray-500'>Appt ID</p>
                                    <p className='font-mono text-xs'>{selectedAppt._id}</p>
                                </div>
                            </div>

                            <div className='bg-gray-50 p-4 rounded-lg mb-6 space-y-2'>
                                <div className='flex justify-between'>
                                    <span className='text-gray-600'>Consultation Fee</span>
                                    <span className='font-medium'>{currency}{selectedAppt.amount}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-gray-600'>Tax / Service Charge</span>
                                    <span className='font-medium'>{currency}0</span>
                                </div>
                                <div className='border-t pt-2 mt-2 flex justify-between items-center'>
                                    <span className='font-bold text-lg'>Total Payable</span>
                                    <span className='font-bold text-2xl text-gray-800'>{currency}{selectedAppt.amount}</span>
                                </div>
                            </div>

                            {selectedAppt.paymentStatus === 'paid' ? (
                                <div className='bg-green-50 text-green-700 p-4 rounded-lg text-center font-bold border border-green-200'>
                                    ✅ Payment Complete
                                    <button
                                        className='block w-full mt-2 text-sm bg-white border border-green-200 py-1 rounded shadow-sm hover:bg-green-50'
                                        onClick={() => window.print()}
                                    >
                                        Print Receipt
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className='text-sm font-bold text-gray-700 mb-2'>Select Payment Method</p>
                                    <div className='grid grid-cols-2 gap-2 mb-6'>
                                        {['Cash', 'Card', 'UPI', 'Online'].map(method => (
                                            <button
                                                key={method}
                                                onClick={() => setPaymentMethod(method)}
                                                className={`py-2 px-3 border rounded-lg text-sm font-medium transition-all ${paymentMethod === method ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handlePayment}
                                        className='w-full bg-green-500 text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-600 transition-all text-lg'
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StaffBilling
