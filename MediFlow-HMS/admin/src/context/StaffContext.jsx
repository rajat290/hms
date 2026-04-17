import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";
import { createClientConfig } from "@shared/config/clientConfig.js";
import { persistStoredSession, readStoredValue } from "@shared/utils/sessionStorage.js";

export const StaffContext = createContext()

const SESSION_PLACEHOLDER = '__cookie_session__';

const StaffContextProvider = (props) => {

    const { backendUrl } = createClientConfig(import.meta.env);

    const [sToken, setSToken] = useState(() => readStoredValue('sToken'))
    const [sRefreshToken, setSRefreshToken] = useState(() => readStoredValue('sRefreshToken'))

    const [staffProfile, setStaffProfile] = useState(false)
    const [dashData, setDashData] = useState(false)
    const [appointments, setAppointments] = useState([])
    const [patients, setPatients] = useState([])

    const persistStaffSession = (nextAccessToken = SESSION_PLACEHOLDER, nextRefreshToken = SESSION_PLACEHOLDER) => {
        const hasSession = Boolean(nextAccessToken || nextRefreshToken);
        const { accessToken, refreshToken } = persistStoredSession({
            accessKey: 'sToken',
            refreshKey: 'sRefreshToken',
            accessToken: hasSession ? SESSION_PLACEHOLDER : '',
            refreshToken: hasSession ? SESSION_PLACEHOLDER : '',
        })

        setSToken(accessToken)
        setSRefreshToken(refreshToken)
    }

    const clearStaffSession = () => {
        persistStaffSession('', '')
        setStaffProfile(false)
        setDashData(false)
        setAppointments([])
        setPatients([])
    }

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
            const { data } = await axios.get(backendUrl + '/api/staff/dashboard', { headers: { sToken } })
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

    const updatePayment = async (appointmentId, paymentStatus, paymentMethod, partialAmount, billingItems) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/staff/update-payment', { appointmentId, paymentStatus, paymentMethod, partialAmount, billingItems }, { headers: { sToken } })
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
        sRefreshToken, setSRefreshToken,
        persistStaffSession,
        clearStaffSession,
        backendUrl,
        staffProfile, setStaffProfile, getStaffProfile,
        appointments, getAllAppointments,
        cancelAppointment,
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
