import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { jsPDF } from "jspdf"

const AppointmentDetails = () => {
    const { appointmentId } = useParams()
    const { backendUrl, token, currency } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointment, setAppointment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [prescriptions, setPrescriptions] = useState({})

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    const fetchAppointmentDetails = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            if (data.success) {
                const app = data.appointments.find(a => a._id === appointmentId)
                if (app) {
                    setAppointment(app)
                } else {
                    toast.error("Appointment not found")
                    navigate('/my-appointments')
                }
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const getUserPrescriptions = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/prescriptions', { headers: { token } })
            if (data.success) {
                const presMap = {};
                data.prescriptions.forEach(p => {
                    presMap[p.appointmentId] = p;
                });
                setPrescriptions(presMap);
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Reuse payment/cancel logic (condensed)
    const cancelAppointment = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                fetchAppointmentDetails()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Appointment Payment',
            description: "Appointment Payment",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                try {
                    const { data } = await axios.post(backendUrl + "/api/user/verifyRazorpay", response, { headers: { token } });
                    if (data.success) {
                        fetchAppointmentDetails()
                    }
                } catch (error) {
                    toast.error(error.message)
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const appointmentRazorpay = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-razorpay', { appointmentId }, { headers: { token } })
            if (data.success) {
                initPay(data.order)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const downloadInvoice = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text("INVOICE", 105, 20, null, null, "center");

        doc.setFontSize(10);
        doc.text(`Invoice ID: INV-${appointment._id.substr(-6).toUpperCase()}`, 140, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 35);

        // Doctor/Hospital Details
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Billed To:", 20, 50);
        doc.setFont(undefined, 'normal');
        doc.text(`Patient Name: ${appointment.userData.name || 'Patient'}`, 20, 58);
        doc.text(`Phone: ${appointment.userData.phone || 'N/A'}`, 20, 64);

        doc.setFont(undefined, 'bold');
        doc.text("Service Provider:", 120, 50);
        doc.setFont(undefined, 'normal');
        doc.text(`Dr. ${appointment.docData.name}`, 120, 58);
        doc.text(`${appointment.docData.speciality}`, 120, 64);
        doc.text(`${appointment.docData.address.line1}`, 120, 70);

        // Table Header
        doc.setLineWidth(0.5);
        doc.line(20, 85, 190, 85);
        doc.setFont(undefined, 'bold');
        doc.text("Description", 20, 92);
        doc.text("Amount", 160, 92);
        doc.line(20, 95, 190, 95);

        // Items
        doc.setFont(undefined, 'normal');
        doc.text(`Medical Appointment Consultation`, 20, 105);
        doc.text(`Date: ${slotDateFormat(appointment.slotDate)} Time: ${appointment.slotTime}`, 20, 111);
        doc.text(`${currency}${appointment.amount}`, 160, 105);

        // Total
        doc.line(20, 120, 190, 120);
        doc.setFont(undefined, 'bold');
        doc.text("Total Paid:", 120, 128);
        doc.text(`${currency}${appointment.amount}`, 160, 128);

        // Footer
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text("Thank you for your business.", 105, 150, null, null, "center");

        doc.save(`Invoice_${appointment._id}.pdf`);
    }

    const downloadPrescription = () => {
        const prescription = prescriptions[appointment._id];
        if (!prescription) return;

        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Prescription", 105, 20, null, null, "center");

        doc.setFontSize(12);
        doc.text(`Doctor: ${appointment.docData.name}`, 20, 40);
        doc.text(`Speciality: ${appointment.docData.speciality}`, 20, 50);
        doc.text(`Date: ${slotDateFormat(appointment.slotDate)}`, 20, 60);

        doc.setLineWidth(0.5);
        doc.line(20, 70, 190, 70);

        doc.setFontSize(16);
        doc.text("Medicines", 20, 85);

        doc.setFontSize(12);
        let yPos = 100;
        prescription.medicines.forEach((med, index) => {
            doc.text(`${index + 1}. ${med.name} - ${med.dosage} (${med.duration})`, 20, yPos);
            if (med.instruction) doc.text(`   Instruction: ${med.instruction}`, 20, yPos + 7);
            yPos += 15;
        });

        doc.save(`Prescription_${appointment.slotDate}.pdf`);
    }

    useEffect(() => {
        if (token && appointmentId) {
            fetchAppointmentDetails()
            getUserPrescriptions()
        }
    }, [token, appointmentId])

    if (loading) return <div className="mt-10 pl-40">Loading details...</div>
    if (!appointment) return null

    return (
        <div className="mt-10">
            <h2 className='text-2xl font-medium text-gray-700 mb-6'>Appointment Details</h2>

            <div className='flex flex-col sm:flex-row gap-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
                {/* Doctor Image */}
                <div>
                    <img className='w-full sm:w-64 rounded-lg bg-[#EAEFFF] object-cover' src={appointment.docData.image} alt="" />
                </div>

                {/* Details */}
                <div className='flex-1'>
                    <p className='text-3xl font-semibold text-gray-800'>{appointment.docData.name}</p>
                    <p className='text-gray-600 mt-1'>{appointment.docData.speciality}</p>

                    <div className='mt-6'>
                        <h3 className='font-medium text-gray-700'>Address:</h3>
                        <p className='text-gray-500 text-sm mt-1'>{appointment.docData.address.line1}</p>
                        <p className='text-gray-500 text-sm'>{appointment.docData.address.line2}</p>
                    </div>

                    <div className='mt-6'>
                        <h3 className='font-medium text-gray-700'>Schedule:</h3>
                        <p className='text-gray-500 text-sm mt-1'>
                            {slotDateFormat(appointment.slotDate)} at {appointment.slotTime}
                        </p>
                    </div>

                    <div className='mt-6'>
                        <h3 className='font-medium text-gray-700'>Status:</h3>
                        <div className='flex gap-2 mt-1 items-center'>
                            {appointment.cancelled ? (
                                <span className='text-red-500 font-medium border border-red-500 px-3 py-1 rounded text-sm bg-red-50'>Cancelled</span>
                            ) : appointment.isCompleted ? (
                                <span className='text-green-500 font-medium border border-green-500 px-3 py-1 rounded text-sm bg-green-50'>Completed</span>
                            ) : appointment.isAccepted ? (
                                <span className='text-green-500 font-medium border border-green-500 px-3 py-1 rounded text-sm bg-green-50'>Accepted</span>
                            ) : (
                                <span className='text-blue-500 font-medium border border-blue-500 px-3 py-1 rounded text-sm bg-blue-50'>Pending</span>
                            )}

                            {!appointment.cancelled && (
                                <span className={`px-3 py-1 rounded text-sm font-medium border ${appointment.payment || appointment.paymentStatus === 'paid'
                                    ? 'text-green-600 border-green-200 bg-green-50'
                                    : 'text-yellow-600 border-yellow-200 bg-yellow-50'
                                    }`}>
                                    {appointment.payment || appointment.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Notes Section */}
                    {appointment.notes && appointment.notes.length > 0 && (
                        <div className='mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100'>
                            <p className='font-semibold text-gray-700 mb-2'>Doctor Notes:</p>
                            <ul className='list-disc list-inside text-sm text-gray-600 space-y-1'>
                                {appointment.notes.map((n, i) => <li key={i}>{n}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className='mt-8 flex flex-wrap gap-4'>
                {/* Pay Button */}
                {!appointment.cancelled && !appointment.isCompleted && !appointment.payment && appointment.paymentStatus !== 'paid' && (
                    <button onClick={appointmentRazorpay} className='px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all'>
                        Pay Online ({currency}{appointment.amount})
                    </button>
                )}

                {/* Cancel Button */}
                {!appointment.cancelled && !appointment.isCompleted && (
                    <button onClick={cancelAppointment} className='px-6 py-3 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-all'>
                        Cancel Appointment
                    </button>
                )}

                {/* Download Invoice */}
                {(appointment.payment || appointment.paymentStatus === 'paid') && !appointment.cancelled && (
                    <button onClick={downloadInvoice} className='px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all flex items-center gap-2'>
                        <span>Download Invoice</span>
                    </button>
                )}

                {/* Download Prescription */}
                {prescriptions[appointment._id] && (
                    <button onClick={downloadPrescription} className='px-6 py-3 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition-all'>
                        Download Prescription
                    </button>
                )}
            </div>
        </div>
    )
}

export default AppointmentDetails
