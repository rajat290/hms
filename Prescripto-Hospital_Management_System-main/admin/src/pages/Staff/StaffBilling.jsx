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

    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState({ name: '', cost: '' })

    // When an appointment is selected, reset items
    const selectAppt = (appt) => {
        setSelectedAppt(appt)
        setItems(appt.billingItems || [])
        setStep(2)
    }

    const addItem = () => {
        if (!newItem.name || !newItem.cost) return
        const newItems = [...items, { name: newItem.name, cost: Number(newItem.cost) }]
        setItems(newItems)
        setNewItem({ name: '', cost: '' })
    }

    const totalAmount = (selectedAppt?.amount || 0) + items.reduce((acc, curr) => acc + curr.cost, 0)

    const handlePayment = async () => {
        if (!selectedAppt) return
        // Send itemized billing and total amount to backend
        await updatePayment(selectedAppt._id, 'paid', paymentMethod, totalAmount, items)
        setStep(1)
        setSelectedAppt(null)
        setItems([])
        toast.success("Payment Recorded Successfully")
    }

    return (
        <div className='m-5 max-w-6xl mx-auto'>
            <h1 className='text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3'>
                <img src={assets.earning_icon} className='w-10' alt="" /> Billing Cockpit
            </h1>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* Left Panel: List */}
                <div className='lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit'>
                    <div className='p-4 border-b bg-gray-50 flex items-center gap-2'>
                        <img src={assets.list_icon} className='w-5 opacity-50' alt="" />
                        <input
                            type="text"
                            placeholder='Search Patient...'
                            className='w-full bg-transparent outline-none text-sm'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className='max-h-[70vh] overflow-y-auto divide-y divide-gray-50'>
                        {filteredAppts.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => selectAppt(item)}
                                className={`p-4 cursor-pointer hover:bg-indigo-50/50 transition-all ${selectedAppt?._id === item._id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                            >
                                <div className='flex justify-between items-start'>
                                    <div>
                                        <p className='font-bold text-gray-800'>{item.userData.name}</p>
                                        <p className='text-[10px] text-gray-400 font-mono'>{item._id.slice(-8).toUpperCase()}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {item.paymentStatus}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center mt-2'>
                                    <p className='text-xs text-gray-500'>{slotDateFormat(item.slotDate)}</p>
                                    <p className='text-sm font-bold text-gray-900'>{currency}{item.amount}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Action */}
                <div className='lg:col-span-2 space-y-6'>
                    {!selectedAppt ? (
                        <div className='bg-white rounded-2xl border-2 border-dashed border-gray-200 p-20 flex flex-col items-center justify-center text-gray-400'>
                            <div className='bg-gray-50 p-6 rounded-full mb-4'>
                                <img src={assets.earning_icon} className='w-12 opacity-10' alt="" />
                            </div>
                            <p className='font-medium'>Select an appointment to generate invoice</p>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {/* Invoice Details */}
                            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 print:border-none print:shadow-none'>
                                <div className='flex justify-between items-start mb-6'>
                                    <div>
                                        <h2 className='text-xl font-black text-gray-900 uppercase tracking-tighter'>Invoice</h2>
                                        <p className='text-[10px] text-gray-400 font-mono mt-1'>#{selectedAppt._id.toUpperCase()}</p>
                                    </div>
                                    <div className='text-right'>
                                        <p className='text-xs font-bold text-indigo-600'>{slotDateFormat(selectedAppt.slotDate)}</p>
                                        <p className='text-[10px] text-gray-500'>{selectedAppt.slotTime}</p>
                                    </div>
                                </div>

                                <div className='space-y-4 mb-8'>
                                    <div className='flex justify-between text-sm pb-2 border-b border-dashed'>
                                        <span className='text-gray-500 font-medium'>Consultation Fee</span>
                                        <span className='font-bold text-gray-800'>{currency}{selectedAppt.amount}</span>
                                    </div>

                                    {items.map((item, idx) => (
                                        <div key={idx} className='flex justify-between text-sm animate-fadeIn'>
                                            <span className='text-gray-600'>{item.name}</span>
                                            <span className='font-bold text-gray-800'>{currency}{item.cost}</span>
                                        </div>
                                    ))}

                                    <div className='pt-4 mt-4 border-t-2 border-gray-900'>
                                        <div className='flex justify-between items-center'>
                                            <span className='text-xs font-black uppercase tracking-widest text-gray-400'>Grand Total</span>
                                            <span className='text-2xl font-black text-gray-900'>{currency}{totalAmount}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className='mt-10 pt-6 border-t border-gray-100 print:hidden'>
                                    {selectedAppt.paymentStatus === 'paid' ? (
                                        <div className='space-y-3'>
                                            <div className='bg-green-500 text-white p-4 rounded-xl text-center font-bold flex items-center justify-center gap-2'>
                                                <span>✓</span> PAYMENT RECEIVED
                                            </div>
                                            <button onClick={() => window.print()} className='w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg'>
                                                🖨️ Print Receipt
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='space-y-4'>
                                            <div>
                                                <p className='text-xs font-bold text-gray-400 uppercase mb-3'>Select Method</p>
                                                <div className='grid grid-cols-4 gap-2'>
                                                    {['Cash', 'Card', 'UPI', 'EMI'].map(m => (
                                                        <button
                                                            key={m}
                                                            onClick={() => setPaymentMethod(m)}
                                                            className={`py-2 rounded-lg text-xs font-bold transition-all ${paymentMethod === m ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                        >
                                                            {m}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={handlePayment} className='w-full py-4 bg-green-500 text-white rounded-xl font-black text-lg hover:bg-green-600 transition-all shadow-xl'>
                                                RECIEVE {currency}{totalAmount}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Itemized Adder (Staff Only Tool) */}
                            <div className='bg-indigo-900 rounded-2xl p-6 text-white h-fit print:hidden'>
                                <h3 className='text-lg font-bold mb-4 flex items-center gap-2'>
                                    <span className='bg-white/20 p-1.5 rounded-lg'>➕</span> Add Charges
                                </h3>
                                <p className='text-indigo-200 text-xs mb-6'>Add medicine, lab tests, or other service charges to this invoice.</p>

                                <div className='space-y-4'>
                                    <div>
                                        <label className='block text-[10px] font-black uppercase text-indigo-300 mb-1'>Item Description</label>
                                        <input
                                            type="text"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            className='w-full bg-indigo-800 border-none rounded-xl px-4 py-3 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-indigo-400'
                                            placeholder='e.g. Blood Test'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[10px] font-black uppercase text-indigo-300 mb-1'>Cost ({currency})</label>
                                        <input
                                            type="number"
                                            value={newItem.cost}
                                            onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                                            className='w-full bg-indigo-800 border-none rounded-xl px-4 py-3 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-indigo-400'
                                            placeholder='0.00'
                                        />
                                    </div>
                                    <button onClick={addItem} className='w-full bg-white text-indigo-900 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg mt-2'>
                                        Add to Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StaffBilling
