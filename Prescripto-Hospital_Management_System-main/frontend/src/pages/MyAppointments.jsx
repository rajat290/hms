import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { jsPDF } from "jspdf"

const MyAppointments = () => {

    const { backendUrl, token, currency } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])
    const [prescriptions, setPrescriptions] = useState({})
    const [payment, setPayment] = useState('')

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            setAppointments(data.appointments.reverse())

        } catch (error) {
            console.log(error)
            toast.error(error.message)
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

    const downloadPrescription = (prescription, appointment) => {
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

    // Function to cancel appointment Using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
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

                console.log(response)

                try {
                    const { data } = await axios.post(backendUrl + "/api/user/verifyRazorpay", response, { headers: { token } });
                    if (data.success) {
                        navigate('/my-appointments')
                        getUserAppointments()
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error.message)
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    // Function to make payment using razorpay
    const appointmentRazorpay = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-razorpay', { appointmentId }, { headers: { token } })
            if (data.success) {
                initPay(data.order)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to make payment using stripe
    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-stripe', { appointmentId }, { headers: { token } })
            if (data.success) {
                const { session_url } = data
                window.location.replace(session_url)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }



    useEffect(() => {
        if (token) {
            getUserAppointments()
            getUserPrescriptions()
        }
    }, [token])

    return (
        <div>
            <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
            <div className=''>
                {appointments.map((item, index) => (
                    <div key={index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
                        <div>
                            <img className='w-36 bg-[#EAEFFF]' src={item.docData.image} alt="" />
                        </div>
                        <div className='flex-1 text-sm text-[#5E5E5E]'>
                            <p className='text-[#262626] text-base font-semibold'>{item.docData.name}</p>
                            <p>{item.docData.speciality}</p>
                            <p className='text-[#464646] font-medium mt-1'>Address:</p>
                            <p className=''>{item.docData.address.line1}</p>
                            <p className=''>{item.docData.address.line2}</p>
                            <p className=' mt-1'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} |  {item.slotTime}</p>
                        </div>
                        <div></div>
                        <div className='flex flex-col gap-2 justify-end text-sm text-center'>
                            {!item.cancelled && item.paymentStatus !== 'paid' && !item.payment && !item.isCompleted && <span className='text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded'>Unpaid</span>}
                            {!item.cancelled && (item.paymentStatus === 'paid' || item.payment) && !item.isCompleted && <span className='text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded'>Paid</span>}
                            {item.cancelled && <span className='text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded'>Cancelled</span>}
                            {item.isCompleted && <span className='text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded'>Completed</span>}
                            {!item.cancelled && !item.isCompleted && item.isAccepted && (item.payment || item.paymentStatus === 'paid') && <span className='text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded'>Accepted</span>}
                            {!item.cancelled && !item.isCompleted && !item.isAccepted && (item.payment || item.paymentStatus === 'paid') && <span className='text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded'>Pending</span>}

                            <button onClick={() => navigate(`/my-appointments/${item._id}`)} className='sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>View Details</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MyAppointments
