import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const BillingPayments = () => {
    const { aToken, appointments, getAllAppointments, backendUrl } = useContext(AdminContext)
    const { calculateAge, slotDateFormat, currency } = useContext(AppContext)

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedItems, setSelectedItems] = useState([])
    const [selectAll, setSelectAll] = useState(false)

    useEffect(() => {
        if (aToken) {
            getAllAppointments()
        }
    }, [aToken])

    // Filter appointments based on search and status
    const filteredAppointments = appointments.filter(item => {
        const matchesSearch = item.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.docData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item._id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' ||
            (item.paymentStatus || (item.payment ? 'paid' : 'unpaid')) === statusFilter
        return matchesSearch && matchesStatus
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
            <p className='mb-3 text-lg font-medium'>Billing & Payments</p>

            {/* Search and Filter Controls */}
            <div className='bg-white p-4 rounded border mb-4'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
                    <div>
                        <input
                            type='text'
                            placeholder='Search by patient, doctor, or ID...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full border rounded px-3 py-2'
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='w-full border rounded px-3 py-2'
                        >
                            <option value='all'>All Status</option>
                            <option value='paid'>Paid</option>
                            <option value='partially paid'>Partially Paid</option>
                            <option value='unpaid'>Unpaid</option>
                            <option value='refunded'>Refunded</option>
                        </select>
                    </div>
                    <div className='flex items-center'>
                        <button
                            onClick={() => setSearchTerm('')}
                            className='bg-gray-500 text-white px-4 py-2 rounded mr-2'
                        >
                            Clear
                        </button>
                    </div>
                    <div className='text-sm text-gray-600'>
                        Showing {filteredAppointments.length} of {appointments.length} appointments
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
            </div>

            <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[0.5fr_0.5fr_3fr_1fr_3fr_3fr_1fr_2fr] grid-flow-col py-3 px-6 border-b'>
                    <input
                        type='checkbox'
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className='w-4 h-4'
                    />
                    <p>#</p>
                    <p>Patient</p>
                    <p>Age</p>
                    <p>Date & Time</p>
                    <p>Doctor</p>
                    <p>Fees</p>
                    <p>Status</p>
                    <p>Actions</p>
                </div>
                {filteredAppointments.map((item, index) => {
                    const invoiceId = getInvoiceId(item._id)
                    return (
                        <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_0.5fr_3fr_1fr_3fr_3fr_1fr_2fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
                            <input
                                type='checkbox'
                                checked={selectedItems.includes(item._id)}
                                onChange={() => handleSelectItem(item._id)}
                                className='w-4 h-4'
                            />
                            <p className='max-sm:hidden'>{index + 1}</p>
                            <div className='flex items-center gap-2'>
                                <img className='w-8 rounded-full' src={item.userData.image} alt="" /> <p>{item.userData.name}</p>
                            </div>
                            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
                            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                            <div className='flex items-center gap-2'>
                                <img className='w-8 rounded-full bg-gray-200' src={item.docData.image} alt="" /> <p>{item.docData.name}</p>
                            </div>
                            <p>{currency}{item.amount}</p>
                            <div className='flex flex-col gap-2'>
                                <span className={`px-2 py-1 rounded text-xs ${item.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' :
                                    item.paymentStatus === 'partially paid' ? 'bg-yellow-100 text-yellow-600' :
                                        item.paymentStatus === 'refunded' ? 'bg-gray-200 text-gray-600' :
                                            'bg-red-100 text-red-600'
                                    }`}>
                                    {item.paymentStatus || (item.payment ? 'paid' : 'unpaid')}
                                </span>
                            </div>
                            <div className='flex flex-col gap-1 text-xs'>
                                {/* Payment Controls */}
                                {item.paymentStatus !== 'paid' && item.paymentStatus !== 'refunded' && (
                                    <button onClick={() => updatePaymentStatus(item._id, 'paid')} className='text-green-600 border border-green-600 px-2 py-1 rounded hover:bg-green-50'>
                                        Mark Paid
                                    </button>
                                )}
                                {item.paymentStatus === 'unpaid' && (
                                    <button onClick={() => {
                                        const amt = prompt('Enter partial amount:');
                                        if (amt) updatePaymentStatus(item._id, 'partially paid', Number(amt));
                                    }} className='text-yellow-600 border border-yellow-600 px-2 py-1 rounded hover:bg-yellow-50'>
                                        Partial Pay
                                    </button>
                                )}

                                {/* Invoice Controls */}
                                {invoiceId ? (
                                    <button onClick={() => downloadInvoice(invoiceId)} className='text-blue-600 border border-blue-600 px-2 py-1 rounded hover:bg-blue-50'>
                                        Download Inv
                                    </button>
                                ) : (
                                    <button onClick={() => generateInvoice(item._id)} className='text-indigo-600 border border-indigo-600 px-2 py-1 rounded hover:bg-indigo-50'>
                                        Generate Inv
                                    </button>
                                )}

                                {/* Refund Control */}
                                {(item.paymentStatus === 'paid' || item.paymentStatus === 'partially paid') && (
                                    <button onClick={() => handleRefund(item._id, item.amount)} className='text-red-500 border border-red-500 px-2 py-1 rounded hover:bg-red-50'>
                                        Refund
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default BillingPayments
