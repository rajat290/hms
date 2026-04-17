import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";
import { createClientConfig } from "@shared/config/clientConfig.js";
import { persistStoredSession, readStoredValue } from "@shared/utils/sessionStorage.js";


export const AdminContext = createContext()

const SESSION_PLACEHOLDER = '__cookie_session__';

const AdminContextProvider = (props) => {

    const { backendUrl } = createClientConfig(import.meta.env)

    const [aToken, setAToken] = useState(() => readStoredValue('aToken'))
    const [aRefreshToken, setARefreshToken] = useState(() => readStoredValue('aRefreshToken'))

    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [staff, setStaff] = useState([])
    const [dashData, setDashData] = useState(false)

    const persistAdminSession = (nextAccessToken = SESSION_PLACEHOLDER, nextRefreshToken = SESSION_PLACEHOLDER) => {
        const hasSession = Boolean(nextAccessToken || nextRefreshToken);
        const { accessToken, refreshToken } = persistStoredSession({
            accessKey: 'aToken',
            refreshKey: 'aRefreshToken',
            accessToken: hasSession ? SESSION_PLACEHOLDER : '',
            refreshToken: hasSession ? SESSION_PLACEHOLDER : '',
        })

        setAToken(accessToken)
        setARefreshToken(refreshToken)
    }

    const clearAdminSession = () => {
        persistAdminSession('', '')
    }

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Getting all Staff data from Database using API
    const getAllStaff = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/all-staff', { headers: { aToken } })
            if (data.success) {
                setStaff(data.staff)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }


    }


    // Function to Mark appointment accepted using API
    const acceptAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/accept-appointment', { appointmentId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
                if (dashData) getDashData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

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

    const value = {
        aToken, setAToken,
        aRefreshToken, setARefreshToken,
        persistAdminSession,
        clearAdminSession,
        backendUrl,
        doctors,
        getAllDoctors,
        changeAvailability,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        acceptAppointment,
        dashData,
        staff,
        getAllStaff
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider
