import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { jsPDF } from "jspdf"

const MyBilling = () => {
    const { backendUrl, token, currency } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [financials, setFinancials] = useState({ totalPaid: 0, pendingDues: 0 })
    const [loading, setLoading] = useState(true)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    const fetchBillingData = async () => {
        try {
            const [appRes, finRes] = await Promise.all([
                axios.get(backendUrl + '/api/user/appointments', { headers: { token } }),
                axios.get(backendUrl + '/api/user/financial-summary', { headers: { token } })
            ])

            if (appRes.data.success) {
                setAppointments(appRes.data.appointments.reverse())
            }
            if (finRes.data.success) {
                setFinancials({ totalPaid: finRes.data.totalPaid, pendingDues: finRes.data.pendingDues })
            }
        } catch (error) {
            console.log(error)
            toast.error("Failed to load billing data")
        } finally {
            setLoading(false)
        }
    }

    const downloadInvoice = (appointment) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("INVOICE", 105, 20, null, null, "center");

        doc.setFontSize(10);
        doc.text(`Invoice ID: INV-${appointment._id.substr(-6).toUpperCase()}`, 140, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 35);

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Billed To:", 20, 50);
        doc.setFont(undefined, 'normal');
        doc.text(`Patient Name: ${appointment.userData.name}`, 20, 58);
        doc.text(`Phone: ${appointment.userData.phone}`, 20, 64);

        doc.setFont(undefined, 'bold');
        doc.text("Service Provider:", 120, 50);
        doc.setFont(undefined, 'normal');
        doc.text(`Dr. ${appointment.docData.name}`, 120, 58);
        doc.text(`${appointment.docData.speciality}`, 120, 64);

        doc.line(20, 85, 190, 85);
        doc.setFont(undefined, 'bold');
        doc.text("Description", 20, 92);
        doc.text("Amount", 160, 92);
        doc.line(20, 95, 190, 95);

        doc.setFont(undefined, 'normal');
        doc.text(`Consultation: ${slotDateFormat(appointment.slotDate)}`, 20, 105);
        doc.text(`${currency}${appointment.amount}`, 160, 105);

        doc.line(20, 120, 190, 120);
        doc.setFont(undefined, 'bold');
        doc.text("Total Paid:", 120, 128);
        doc.text(`${currency}${appointment.amount}`, 160, 128);

        doc.save(`Invoice_${appointment._id}.pdf`);
    }

    useEffect(() => {
        if (token) {
            fetchBillingData()
        }
    }, [token])

    if (loading) return <div className='mt-10 pl-40'>Loading billing history...</div>

    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-medium text-gray-700 mb-6'>Billing & Payments</h2>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10'>
                <div className='bg-green-50 p-6 rounded-lg border border-green-100'>
                    <p className='text-green-600 font-medium'>Total Paid</p>
                    <p className='text-3xl font-bold text-green-700'>{currency}{financials.totalPaid}</p>
                </div>
                <div className='bg-red-50 p-6 rounded-lg border border-red-100'>
                    <p className='text-red-500 font-medium'>Pending Dues</p>
                    <p className='text-3xl font-bold text-red-600'>{currency}{financials.pendingDues}</p>
                </div>
            </div>

            <div className='bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden'>
                <table className='w-full text-left border-collapse'>
                    <thead className='bg-gray-50 text-gray-600 font-medium text-sm'>
                        <tr>
                            <th className='p-4 border-b'>Date</th>
                            <th className='p-4 border-b'>Doctor</th>
                            <th className='p-4 border-b'>Amount</th>
                            <th className='p-4 border-b'>Status</th>
                            <th className='p-4 border-b text-right'>Action</th>
                        </tr>
                    </thead>
                    <tbody className='text-gray-700 text-sm'>
                        {appointments.map((item, index) => (
                            <tr key={index} className='hover:bg-gray-50 border-b last:border-none'>
                                <td className='p-4'>{slotDateFormat(item.slotDate)}</td>
                                <td className='p-4'>Dr. {item.docData.name}</td>
                                <td className='p-4'>{currency}{item.amount}</td>
                                <td className='p-4'>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.paymentStatus === 'paid' || item.payment ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {item.paymentStatus === 'paid' || item.payment ? 'Paid' : 'Unpaid'}
                                    </span>
                                </td>
                                <td className='p-4 text-right'>
                                    {(item.paymentStatus === 'paid' || item.payment) ? (
                                        <button onClick={() => downloadInvoice(item)} className='text-primary hover:underline font-medium'>Download Invoice</button>
                                    ) : (
                                        <button onClick={() => navigate(`/my-appointments/${item._id}`)} className='text-primary hover:underline'>Pay Now</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default MyBilling
