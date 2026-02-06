import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";

export const StaffContext = createContext()

const StaffContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [sToken, setSToken] = useState(localStorage.getItem('sToken') ? localStorage.getItem('sToken') : '')

    console.log("StaffContext sToken:", sToken);
    const [staffProfile, setStaffProfile] = useState(false)
    const [dashData, setDashData] = useState(false)
    const [appointments, setAppointments] = useState([])
    const [patients, setPatients] = useState([])

    // Getting Staff Profile
    const getStaffProfile = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/staff/profile', { headers: { sToken } })
            if (data.success) {
                setStaffProfile(data.staff)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getAllAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/staff/appointments', { headers: { sToken } })
            if (data.success) {
                setAppointments(data.appointments)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/staff/cancel-appointment', { appointmentId }, { headers: { sToken } })
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
                if (dashData) getDashData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getAllPatients = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/staff/all-patients', { headers: { sToken } })
            if (data.success) {
                setPatients(data.patients)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getDashData = async () => {
        try {
            console.log("Fetching Staff Dashboard Data with token:", sToken);
            const { data } = await axios.get(backendUrl + '/api/staff/dashboard', { headers: { sToken } })
            console.log("Staff Dashboard API Response:", data);
            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const markAppointmentPaid = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/staff/mark-paid', { appointmentId }, { headers: { sToken } })
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

    const checkInAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/staff/mark-checkin', { appointmentId }, { headers: { sToken } })
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
                if (dashData) getDashData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const updatePayment = async (appointmentId, paymentStatus, paymentMethod, partialAmount) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/staff/update-payment', { appointmentId, paymentStatus, paymentMethod, partialAmount }, { headers: { sToken } })
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
                if (dashData) getDashData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const value = {
        sToken, setSToken,
        backendUrl,
        staffProfile, setStaffProfile, getStaffProfile,
        appointments, getAllAppointments,
        cancelAppointment, markAppointmentPaid,
        patients, getAllPatients,
        dashData, getDashData,
        checkInAppointment, updatePayment
    }

    return (
        <StaffContext.Provider value={value}>
            {props.children}
        </StaffContext.Provider>
    )

}

export default StaffContextProvider
