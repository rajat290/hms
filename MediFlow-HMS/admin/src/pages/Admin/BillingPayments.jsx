import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import PaymentKPIs from '../../components/PaymentKPIs'
import PaymentHistoryModal from '../../components/PaymentHistoryModal'

const BillingPayments = () => {
    const { aToken, appointments, getAllAppointments, backendUrl } = useContext(AdminContext)
    const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedItems, setSelectedItems] = useState([])
    const [selectAll, setSelectAll] = useState(false)
    const [kpis, setKpis] = useState(null)
    const [tabFilter, setTabFilter] = useState('all') // all, pending, overdue, recent
    const [showHistory, setShowHistory] = useState(null) // appointmentId for modal

    const getKPIs = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/payment-kpis`, {
                headers: { aToken }
            })
            const data = await response.json()
            if (data.success) {
                setKpis(data.kpis)
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (aToken) {
            getAllAppointments()
            getKPIs()
        }
    }, [aToken])

    const [dateRange, setDateRange] = useState('all') // all, today, week, month
    const [amountRange, setAmountRange] = useState('all') // all, under50, 50-200, over200

    // Filter appointments based on search, status, date, and amount
    const filteredAppointments = appointments.filter(item => {
        const matchesSearch = item.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.docData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item._id.toLowerCase().includes(searchTerm.toLowerCase())

        const status = item.paymentStatus || (item.payment ? 'paid' : 'unpaid')
        const matchesStatus = statusFilter === 'all' || status === statusFilter

        const aptDate = new Date(item.date)
        const now = new Date()
        let matchesDate = true
        if (dateRange === 'today') {
            matchesDate = aptDate.toDateString() === now.toDateString()
        } else if (dateRange === 'week') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = aptDate >= lastWeek
        } else if (dateRange === 'month') {
            matchesDate = aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear()
        }

        let matchesAmount = true
        if (amountRange === 'under50') {
            matchesAmount = item.amount < 50
        } else if (amountRange === '50-200') {
            matchesAmount = item.amount >= 50 && item.amount <= 200
        } else if (amountRange === 'over200') {
            matchesAmount = item.amount > 200
        }

        return matchesSearch && matchesStatus && matchesDate && matchesAmount
    })

    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([])
        } else {
            setSelectedItems(filteredAppointments.map(item => item._id))
        }
        setSelectAll(!selectAll)
    }

    const bulkUpdateStatus = async (status) => {
        if (selectedItems.length === 0) {
            toast.error('Please select appointments to update')
            return
        }

        try {
            const promises = selectedItems.map(id =>
                fetch(`${backendUrl}/api/admin/update-payment-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        aToken
                    },
                    body: JSON.stringify({ appointmentId: id, paymentStatus: status })
                }).then(res => res.json())
            )

            const results = await Promise.all(promises)
            const successCount = results.filter(r => r.success).length

            if (successCount === selectedItems.length) {
                toast.success(`Updated ${successCount} appointments`)
                getAllAppointments()
                setSelectedItems([])
                setSelectAll(false)
            } else {
                toast.error(`Updated ${successCount} out of ${selectedItems.length} appointments`)
            }
        } catch (error) {
            toast.error('Bulk update failed')
        }
    }

    const updatePaymentStatus = async (appointmentId, status, partialAmount = 0) => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/update-payment-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify({ appointmentId, paymentStatus: status, partialAmount })
            })
            const data = await response.json()
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const generateInvoice = async (appointmentId) => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/generate-invoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify({ appointmentId })
            })
            const data = await response.json()
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const downloadInvoice = async (invoiceId) => {
        try {
            // Check if invoiceId exists first, if not try to find it or generate it
            // For now assuming existing flow or we add a check. 
            // Actually the backend download endpoint needs invoiceId. 
            // We might need to fetch invoices or store invoiceId in appointment.
            // Let's assume for this specific view we might need to fetch invoice details or 
            // checking if the appointment has an invoice.
            // Wait, the appointment model might not store invoiceId directly unless updated.
            // Let's check if we can download by appointmentId or if we need to look it up.
            // Looking at backend: getAllInvoices populates appointmentId. 
            // We might need a way to get invoice ID from appointment ID.

            // Temporary solution: Redirect to a new Invoices page or try to fetch invoice ID
            // Ideally we should list Invoices separately or add an "Invoice" column

            // Let's try to fetch all invoices first to map them
            window.open(`${backendUrl}/api/admin/download-invoice/${invoiceId}`, '_blank')
        } catch (error) {
            toast.error(error.message)
        }
    }

    // We need to fetch invoices to map them to appointments
    const [invoices, setInvoices] = useState([])

    const getAllInvoices = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/all-invoices`, {
                headers: { aToken }
            })
            const data = await response.json()
            if (data.success) {
                setInvoices(data.invoices)
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (aToken) {
            getAllAppointments()
            getAllInvoices()
        }
    }, [aToken])

    const getInvoiceId = (appointmentId) => {
        const invoice = invoices.find(inv => inv.appointmentId._id === appointmentId || inv.appointmentId === appointmentId)
        return invoice ? invoice._id : null
    }

    const handleRefund = async (appointmentId, amount) => {
        const reason = prompt("Enter reason for refund:")
        if (!reason) return

        try {
            const response = await fetch(`${backendUrl}/api/admin/process-refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify({ appointmentId, refundAmount: amount, reason })
            })
            const data = await response.json()
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className='w-full max-w-6xl m-5'>
            <div className='flex justify-between items-center mb-3'>
                <p className='text-lg font-medium'>Billing & Payments Overview</p>
                <button
                    onClick={() => window.open(`${backendUrl}/api/admin/export-financials`, '_blank')}
                    className='bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2'
                >
                    <img className='w-4 invert' src={assets?.list_icon} alt="" />
                    Export Financial Report
                </button>
            </div>

            <PaymentKPIs kpis={kpis} currency={currency} />

            {/* Tabs for Separate Views */}
            <div className='flex items-center gap-2 mb-4 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm w-fit'>
                <button
                    onClick={() => setTabFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tabFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    All Payments
                </button>
                <button
                    onClick={() => setTabFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tabFilter === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setTabFilter('overdue')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tabFilter === 'overdue' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Overdue
                </button>
                <button
                    onClick={() => setTabFilter('recent')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tabFilter === 'recent' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Recent
                </button>
            </div>
            <div className='bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end'>
                    <div className='flex flex-col gap-1'>
                        <label className='text-xs font-semibold text-gray-500 uppercase px-1'>Search</label>
                        <input
                            type='text'
                            placeholder='Patient, doctor, or ID...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none'
                        />
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label className='text-xs font-semibold text-gray-500 uppercase px-1'>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white'
                        >
                            <option value='all'>All Status</option>
                            <option value='paid'>Paid</option>
                            <option value='partially paid'>Partially Paid</option>
                            <option value='unpaid'>Unpaid</option>
                            <option value='refunded'>Refunded</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label className='text-xs font-semibold text-gray-500 uppercase px-1'>Date</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white'
                        >
                            <option value='all'>All Time</option>
                            <option value='today'>Today</option>
                            <option value='week'>Last 7 Days</option>
                            <option value='month'>This Month</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label className='text-xs font-semibold text-gray-500 uppercase px-1'>Amount</label>
                        <select
                            value={amountRange}
                            onChange={(e) => setAmountRange(e.target.value)}
                            className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none bg-white'
                        >
                            <option value='all'>Any Amount</option>
                            <option value='under50'>Under {currency}50</option>
                            <option value='50-200'>{currency}50 - {currency}200</option>
                            <option value='over200'>Over {currency}200</option>
                        </select>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setDateRange('all');
                                setAmountRange('all');
                            }}
                            className='bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all w-full'
                        >
                            Reset
                        </button>
                    </div>
                </div>
                <div className='mt-4 text-xs text-gray-400 italic font-medium'>
                    * Showing {filteredAppointments.length} matching result(s)
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
                <div className='bg-blue-50 p-3 rounded border'>
                    <p className='text-sm mb-2'>{selectedItems.length} appointment(s) selected</p>
                    <div className='flex gap-2'>
                        <button
                            onClick={() => bulkUpdateStatus('paid')}
                            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
                        >
                            Mark Selected as Paid
                        </button>
                        <button
                            onClick={() => bulkUpdateStatus('unpaid')}
                            className='bg-red-500 text-white px-4 py-2 rounded text-sm'
                        >
                            Mark Selected as Unpaid
                        </button>
                        <button
                            onClick={() => {
                                setSelectedItems([]);
                                setSelectAll(false);
                            }}
                            className='bg-gray-500 text-white px-4 py-2 rounded text-sm'
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={() => {
                                const headers = ['Patient', 'Date', 'Doctor', 'Fees', 'Status', 'Payment Method'];
                                const rows = filteredAppointments.map(item => [
                                    item.userData.name,
                                    slotDateFormat(item.slotDate),
                                    item.docData.name,
                                    item.amount,
                                    item.paymentStatus || (item.payment ? 'paid' : 'unpaid'),
                                    item.paymentMethod || 'N/A'
                                ]);

                                const csvContent = "data:text/csv;charset=utf-8,"
                                    + headers.join(",") + "\n"
                                    + rows.map(e => e.join(",")).join("\n");

                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", "billing_report.csv");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className='bg-indigo-600 text-white px-4 py-2 rounded text-sm'
                        >
                            Export CSV
                        </button>
                    </div>
                </div>
            )}

            <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[0.5fr_2fr_1fr_2fr_1.5fr_1fr_1fr_0.5fr] grid-flow-col py-3 px-6 border-b bg-gray-50 font-semibold text-gray-700'>
                    <input
                        type='checkbox'
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className='w-4 h-4 mt-1 cursor-pointer'
                    />
                    <p>Patient Details</p>
                    <p>Age</p>
                    <p>Date & Time</p>
                    <p>Doctor</p>
                    <p>Fees</p>
                    <p>Status</p>
                    <p className='text-right'>Actions</p>
                </div>
                {filteredAppointments.map((item, index) => {
                    const invoiceId = getInvoiceId(item._id)
                    return (
                        <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_2fr_1fr_2fr_1.5fr_1fr_1fr_0.5fr] items-center text-gray-600 py-4 px-6 border-b hover:bg-blue-50/30 transition-colors' key={index}>
                            <input
                                type='checkbox'
                                checked={selectedItems.includes(item._id)}
                                onChange={() => handleSelectItem(item._id)}
                                className='w-4 h-4 cursor-pointer'
                            />
                            <div className='flex items-center gap-3'>
                                <img className='w-10 h-10 rounded-full object-cover border border-gray-200' src={item.userData.image} alt="" />
                                <div className='flex flex-col'>
                                    <p className='font-medium text-gray-800'>{item.userData.name}</p>
                                    <p className='text-xs text-gray-400 sm:hidden'>{calculateAge(item.userData.dob)} years • {item.slotDate}</p>
                                </div>
                            </div>
                            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
                            <div className='flex flex-col'>
                                <p className='text-gray-800'>{slotDateFormat(item.slotDate)}</p>
                                <p className='text-xs font-medium text-indigo-500'>{item.slotTime}</p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <img className='w-8 h-8 rounded-full bg-gray-100 border border-gray-200' src={item.docData.image} alt="" />
                                <div className='flex flex-col'>
                                    <p className='text-gray-800'>{item.docData.name}</p>
                                    <p className='text-[10px] text-gray-400 capitalize'>{item.docData.speciality}</p>
                                </div>
                            </div>
                            <p className='font-bold text-gray-800'>{currency}{item.amount}</p>
                            <div className='flex flex-col gap-1'>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-center ${item.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                                    item.paymentStatus === 'partially paid' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                        item.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                            'bg-red-100 text-red-700 border border-red-200'
                                    }`}>
                                    {item.paymentStatus || (item.payment ? 'paid' : 'unpaid')}
                                </span>
                            </div>
                            <div className='relative flex justify-end group'>
                                <button className='p-2 hover:bg-gray-100 rounded-full transition-colors'>
                                    <img className='w-5' src={assets?.menu_icon || assets?.dropdown_icon} alt="Actions" title="More Actions" />
                                </button>

                                <div className='absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 hidden group-hover:block transition-all'>
                                    <div className='py-2 flex flex-col'>
                                        {/* Payment Actions */}
                                        {item.paymentStatus !== 'paid' && item.paymentStatus !== 'refunded' && (
                                            <button onClick={() => updatePaymentStatus(item._id, 'paid')} className='flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 w-full text-left'>
                                                <div className='w-2 h-2 rounded-full bg-green-600'></div> Mark as Paid
                                            </button>
                                        )}
                                        {item.paymentStatus === 'unpaid' && (
                                            <button onClick={() => {
                                                const amt = prompt('Enter partial amount:');
                                                if (amt) updatePaymentStatus(item._id, 'partially paid', Number(amt));
                                            }} className='flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 w-full text-left'>
                                                <div className='w-2 h-2 rounded-full bg-amber-600'></div> Partial Payment
                                            </button>
                                        )}

                                        <div className='h-[1px] bg-gray-100 my-1'></div>

                                        {/* Invoice Actions */}
                                        {invoiceId ? (
                                            <button onClick={() => downloadInvoice(invoiceId)} className='flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left'>
                                                <div className='w-4 h-4'>📥</div> Download Invoice
                                            </button>
                                        ) : (
                                            <button onClick={() => generateInvoice(item._id)} className='flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 w-full text-left'>
                                                <div className='w-4 h-4'>📄</div> Generate Invoice
                                            </button>
                                        )}

                                        {/* History & Refunds */}
                                        <button onClick={() => setShowHistory(item._id)} className='flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 w-full text-left'>
                                            <div className='w-4 h-4'>🕒</div> View History
                                        </button>

                                        {(item.paymentStatus === 'paid' || item.paymentStatus === 'partially paid') && (
                                            <button onClick={() => handleRefund(item._id, item.amount)} className='flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left border-t border-gray-100 mt-1'>
                                                <div className='w-4 h-4'>↩️</div> Process Refund
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {showHistory && (
                    <PaymentHistoryModal
                        appointmentId={showHistory}
                        onClose={() => setShowHistory(null)}
                        backendUrl={backendUrl}
                        aToken={aToken}
                        currency={currency}
                    />
                )}
            </div>
        </div>
    )
}

export default BillingPayments
