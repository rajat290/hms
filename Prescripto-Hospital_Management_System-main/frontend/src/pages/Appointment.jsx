import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {

    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('online') // 'cash' or 'online'
    const [showPatientForm, setShowPatientForm] = useState(false)
    const [patientInfo, setPatientInfo] = useState({
        name: '',
        phone: '',
        email: '',
        gender: '',
        dob: '',
        address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        emergencyContact: {
            name: '',
            phone: ''
        },
        bloodGroup: '',
        knownAllergies: '',
        currentMedications: '',
        insuranceProvider: '',
        insuranceId: ''
    })

    const navigate = useNavigate()

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSolts = async () => {
        try {
            const { data } = await axios.get(backendUrl + `/api/user/doctor-slots/${docId}`)
            if (data.success) {
                const slotsWithDates = data.slots.map(daySlots =>
                    daySlots.map(slot => ({
                        ...slot,
                        datetime: new Date(slot.datetime)
                    }))
                )
                setDocSlots(slotsWithDates)
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
                        toast.success('Payment Successful! Appointment Confirmed.')
                        navigate('/my-appointments')
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

    const validateForm = () => {
        if (!patientInfo.name || !patientInfo.phone || !patientInfo.gender || !patientInfo.dob) return "Basic info missing"
        if (!patientInfo.address.line1 || !patientInfo.address.city || !patientInfo.address.state || !patientInfo.address.zipCode) return "Address incomplete"
        if (!patientInfo.emergencyContact.name || !patientInfo.emergencyContact.phone) return "Emergency contact missing"
        if (paymentMethod === 'online' && (!patientInfo.insuranceProvider || !patientInfo.insuranceId)) return "Insurance info required for online booking"
        return null
    }

    const bookAppointment = async () => {
        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        try {
            console.log("Fetching profile for booking check...")
            const { data: profileData } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })

            console.log("Profile Data:", profileData)

            if (profileData.success) {
                const u = profileData.userData

                // Check if comprehensive info is present
                const isProfileComplete = u.name && u.phone && u.gender && u.dob &&
                    u.address?.line1 && u.address?.city &&
                    u.emergencyContact?.name &&
                    (paymentMethod !== 'online' || u.insuranceProvider)

                console.log("Is Profile Complete?", isProfileComplete)
                console.log("User Data for Pre-fill:", u)

                if (!isProfileComplete) {
                    const prefillData = {
                        ...patientInfo,
                        name: u.name || '',
                        phone: u.phone || '',
                        email: u.email || '',
                        gender: u.gender || '',
                        dob: u.dob || '',
                        address: {
                            line1: u.address?.line1 || '',
                            line2: u.address?.line2 || '',
                            city: u.address?.city || '',
                            state: u.address?.state || '',
                            zipCode: u.address?.zipCode || '',
                            country: u.address?.country || ''
                        },
                        emergencyContact: {
                            name: u.emergencyContact?.name || '',
                            phone: u.emergencyContact?.phone || ''
                        },
                        bloodGroup: u.bloodGroup || '',
                        knownAllergies: u.knownAllergies || '',
                        currentMedications: u.currentMedications || '',
                        insuranceProvider: u.insuranceProvider || '',
                        insuranceId: u.insuranceId || ''
                    }
                    console.log("Setting Patient Info Prefill:", prefillData)
                    setPatientInfo(prefillData)
                    setShowPatientForm(true)
                    return
                }
            }
        } catch (error) {
            console.log("Profile fetch error:", error)
        }

        // If all good, confirm
        await confirmBooking()
    }

    const confirmBooking = async () => {
        const error = showPatientForm ? validateForm() : null
        if (error) {
            toast.error(error)
            return
        }

        const date = docSlots[slotIndex][0].datetime
        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()
        const slotDate = day + "_" + month + "_" + year

        try {
            // 1. Update Profile if form was shown
            if (showPatientForm) {
                await axios.post(backendUrl + '/api/user/update-profile', {
                    userId: 'userId_is_in_token_backend_handles', // Backend controller uses middleware user ID, but updateProfile controller expects userId in body? 
                    // Wait, userController updateProfile extracts userId from body. But authUser middleware usually adds it to req.body.userId??
                    // Let's check userController: const { userId ... } = req.body. 
                    // Usually authUser middleware adds userId to body. Yes.

                    // Send flat structure where possible or nested?
                    // Controller expects: name, phone, address (object/string), dob, gender, etc.
                    ...patientInfo,
                    address: JSON.stringify(patientInfo.address),
                    emergencyContact: JSON.stringify(patientInfo.emergencyContact)
                }, { headers: { token } })
            }

            // 2. Book Appointment
            const bookingData = {
                docId,
                slotDate,
                slotTime,
                patientInfo: showPatientForm ? patientInfo : null
            }

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', bookingData, { headers: { token } })

            if (data.success) {
                // BUG FIX: API now returns appointmentId
                const appointmentId = data.appointmentId

                if (paymentMethod === 'cash') {
                    toast.success('Appointment booked! Pay cash at the clinic.')
                    navigate('/my-appointments')
                } else {
                    // Online Payment
                    if (appointmentId) {
                        appointmentRazorpay(appointmentId)
                    } else {
                        toast.error('Booking failed: Missing Appointment ID')
                    }
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        fetchDocInfo()
    }, [doctors, docId])

    useEffect(() => {
        getAvailableSolts()
    }, [docId])

    // Styles for form inputs
    const inputStyle = 'border border-gray-300 rounded w-full p-2 text-sm'
    const labelStyle = 'text-xs font-medium mb-1 text-gray-600'

    return docInfo ? (
        <div>
            {/* ... (Existing Doctor Info UI preserved) ... */}
            {/* ---------- Doctor Details ----------- */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div>
                    <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                </div>

                <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
                    <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>{docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" /></p>
                    <div className='flex items-center gap-2 mt-1 text-gray-600'>
                        <p>{docInfo.degree} - {docInfo.speciality}</p>
                        <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
                    </div>
                    <div>
                        <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>About <img className='w-3' src={assets.info_icon} alt="" /></p>
                        <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
                    </div>
                    <p className='text-gray-600 font-medium mt-4'>Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span> </p>
                </div>
            </div>

            {/* Booking slots */}
            <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
                <p >Booking slots</p>
                <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
                    {docSlots.length && docSlots.filter(item => item.length > 0).map((item, index) => {
                        const originalIndex = docSlots.indexOf(item)
                        return (
                            <div onClick={() => setSlotIndex(originalIndex)} key={originalIndex} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === originalIndex ? 'bg-primary text-white' : 'border border-[#DDDDDD]'}`}>
                                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                                <p>{item[0] && item[0].datetime.getDate()}</p>
                            </div>
                        )
                    })}
                </div>

                <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
                    {docSlots.length && docSlots[slotIndex].map((item, index) => (
                        <p onClick={() => setSlotTime(item.time)} key={index} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'}`}>{item.time.toLowerCase()}</p>
                    ))}
                </div>

                {/* Payment Method Selection */}
                {docInfo?.paymentMethods && (
                    <div className='mt-6'>
                        <p className='font-medium mb-3'>Payment Method:</p>
                        <div className='flex gap-4'>
                            {docInfo.paymentMethods.cash && (
                                <label className='flex items-center gap-2 cursor-pointer'>
                                    <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} className='w-4 h-4' />
                                    <span>Cash (Pay at clinic)</span>
                                </label>
                            )}
                            {docInfo.paymentMethods.online && (
                                <label className='flex items-center gap-2 cursor-pointer'>
                                    <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={(e) => setPaymentMethod(e.target.value)} className='w-4 h-4' />
                                    <span>Online Payment (Pay now)</span>
                                </label>
                            )}
                        </div>
                    </div>
                )}

                {/* Extended Patient Form */}
                {showPatientForm && (
                    <div className='mt-6 p-6 border border-gray-300 rounded-lg bg-white shadow-sm'>
                        <h3 className='text-lg font-medium mb-4 text-primary'>Complete Patient Profile</h3>

                        <div className='space-y-6'>
                            {/* Personal Info */}
                            <div>
                                <h4 className='text-sm font-semibold mb-3 border-b pb-1'>Personal Information</h4>
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                    <div><p className={labelStyle}>Full Name *</p><input value={patientInfo.name} onChange={e => setPatientInfo({ ...patientInfo, name: e.target.value })} className={inputStyle} type="text" required /></div>
                                    <div><p className={labelStyle}>Phone *</p><input value={patientInfo.phone} onChange={e => setPatientInfo({ ...patientInfo, phone: e.target.value })} className={inputStyle} type="tel" required /></div>
                                    <div>
                                        <p className={labelStyle}>Gender *</p>
                                        <select value={patientInfo.gender} onChange={e => setPatientInfo({ ...patientInfo, gender: e.target.value })} className={inputStyle}>
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div><p className={labelStyle}>Date of Birth *</p><input value={patientInfo.dob} onChange={e => setPatientInfo({ ...patientInfo, dob: e.target.value })} className={inputStyle} type="date" required /></div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <h4 className='text-sm font-semibold mb-3 border-b pb-1'>Address</h4>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div className='md:col-span-2'><p className={labelStyle}>Address Line 1 *</p><input value={patientInfo.address.line1} onChange={e => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, line1: e.target.value } })} className={inputStyle} type="text" required /></div>
                                    <div className='md:col-span-2'><p className={labelStyle}>Address Line 2</p><input value={patientInfo.address.line2} onChange={e => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, line2: e.target.value } })} className={inputStyle} type="text" /></div>
                                    <div><p className={labelStyle}>City *</p><input value={patientInfo.address.city} onChange={e => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, city: e.target.value } })} className={inputStyle} type="text" required /></div>
                                    <div><p className={labelStyle}>State *</p><input value={patientInfo.address.state} onChange={e => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, state: e.target.value } })} className={inputStyle} type="text" required /></div>
                                    <div><p className={labelStyle}>Zip Code *</p><input value={patientInfo.address.zipCode} onChange={e => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, zipCode: e.target.value } })} className={inputStyle} type="text" required /></div>
                                    <div><p className={labelStyle}>Country</p><input value={patientInfo.address.country} onChange={e => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, country: e.target.value } })} className={inputStyle} type="text" /></div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <h4 className='text-sm font-semibold mb-3 border-b pb-1'>Emergency Contact</h4>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div><p className={labelStyle}>Contact Name *</p><input value={patientInfo.emergencyContact.name} onChange={e => setPatientInfo({ ...patientInfo, emergencyContact: { ...patientInfo.emergencyContact, name: e.target.value } })} className={inputStyle} type="text" required /></div>
                                    <div><p className={labelStyle}>Contact Phone *</p><input value={patientInfo.emergencyContact.phone} onChange={e => setPatientInfo({ ...patientInfo, emergencyContact: { ...patientInfo.emergencyContact, phone: e.target.value } })} className={inputStyle} type="tel" required /></div>
                                </div>
                            </div>

                            {/* Medical Info */}
                            <div>
                                <h4 className='text-sm font-semibold mb-3 border-b pb-1'>Medical Information</h4>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <p className={labelStyle}>Blood Group</p>
                                        <select value={patientInfo.bloodGroup} onChange={e => setPatientInfo({ ...patientInfo, bloodGroup: e.target.value })} className={inputStyle}>
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                    <div><p className={labelStyle}>Known Allergies</p><input value={patientInfo.knownAllergies} onChange={e => setPatientInfo({ ...patientInfo, knownAllergies: e.target.value })} className={inputStyle} type="text" placeholder="e.g. Peanuts, Penicillin" /></div>
                                    <div className='md:col-span-2'><p className={labelStyle}>Current Medications</p><textarea value={patientInfo.currentMedications} onChange={e => setPatientInfo({ ...patientInfo, currentMedications: e.target.value })} className={inputStyle} rows="2"></textarea></div>
                                </div>
                            </div>

                            {/* Insurance */}
                            {paymentMethod === 'online' && (
                                <div>
                                    <h4 className='text-sm font-semibold mb-3 border-b pb-1'>Insurance Information</h4>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div><p className={labelStyle}>Provider Name *</p><input value={patientInfo.insuranceProvider} onChange={e => setPatientInfo({ ...patientInfo, insuranceProvider: e.target.value })} className={inputStyle} type="text" required /></div>
                                        <div><p className={labelStyle}>Policy Number *</p><input value={patientInfo.insuranceId} onChange={e => setPatientInfo({ ...patientInfo, insuranceId: e.target.value })} className={inputStyle} type="text" required /></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className='flex gap-4 mt-6 justify-end'>
                            <button onClick={() => setShowPatientForm(false)} className='px-6 py-2 border rounded text-gray-600 hover:bg-gray-50'>Cancel</button>
                            <button onClick={confirmBooking} className='px-6 py-2 bg-primary text-white rounded hover:bg-blue-600'>Confirm & Book</button>
                        </div>
                    </div>
                )}

                {/* Default Booking Button (Hidden if form is shown) */}
                {!showPatientForm && (
                    <div className='mt-6'>
                        <button onClick={bookAppointment} className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full hover:scale-105 transition-all duration-300'>
                            {paymentMethod === 'cash' ? 'Book Appointment' : 'Proceed to Pay'}
                        </button>
                    </div>
                )}
            </div>

            <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
        </div>
    ) : null
}

export default Appointment