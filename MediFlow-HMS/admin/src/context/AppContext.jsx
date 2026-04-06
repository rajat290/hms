import axios from "axios";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AdminContext } from "./AdminContext";
import { DoctorContext } from "./DoctorContext";
import { StaffContext } from "./StaffContext";

export const AppContext = createContext();

const AppContextProvider = (props) => {

    const currency = import.meta.env.VITE_CURRENCY;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const refreshRequestRef = useRef(null);

    const { aToken, aRefreshToken, persistAdminSession, clearAdminSession } = useContext(AdminContext);
    const { dToken, dRefreshToken, persistDoctorSession, clearDoctorSession } = useContext(DoctorContext);
    const { sToken, sRefreshToken, persistStaffSession, clearStaffSession } = useContext(StaffContext);

    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_');
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2];
    };

    const calculateAge = (dob) => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
        }

        return age;
    };

    const [isEmergencyMode, setIsEmergencyMode] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

    const clearAllSessions = () => {
        clearAdminSession();
        clearDoctorSession();
        clearStaffSession();
    };

    const normalizeAxiosError = (error) => {
        const message = error?.response?.data?.message || error?.message || 'Request failed';
        const normalizedError = new Error(message);
        normalizedError.response = error?.response;
        normalizedError.config = error?.config;
        return normalizedError;
    };

    const getActiveSessionConfig = () => {
        if (aToken || aRefreshToken) {
            return {
                role: 'admin',
                token: aToken,
                refreshToken: aRefreshToken,
                headerName: 'aToken',
                refreshEndpoint: '/api/admin/refresh-session',
                logoutEndpoint: '/api/admin/logout',
                persistSession: persistAdminSession,
                clearSession: clearAdminSession,
            };
        }

        if (dToken || dRefreshToken) {
            return {
                role: 'doctor',
                token: dToken,
                refreshToken: dRefreshToken,
                headerName: 'dToken',
                refreshEndpoint: '/api/doctor/refresh-session',
                logoutEndpoint: '/api/doctor/logout',
                persistSession: persistDoctorSession,
                clearSession: clearDoctorSession,
            };
        }

        if (sToken || sRefreshToken) {
            return {
                role: 'staff',
                token: sToken,
                refreshToken: sRefreshToken,
                headerName: 'sToken',
                refreshEndpoint: '/api/staff/refresh-session',
                logoutEndpoint: '/api/staff/logout',
                persistSession: persistStaffSession,
                clearSession: clearStaffSession,
            };
        }

        return null;
    };

    const refreshCurrentSession = async () => {
        const activeSession = getActiveSessionConfig();

        if (!activeSession?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
            backendUrl + activeSession.refreshEndpoint,
            { refreshToken: activeSession.refreshToken },
            { skipSessionRefresh: true },
        );

        if (!data.success) {
            throw new Error(data.message || 'Session refresh failed');
        }

        activeSession.persistSession(data.token, data.refreshToken);
        return {
            ...data,
            headerName: activeSession.headerName,
        };
    };

    const logoutCurrentSession = async () => {
        const activeSession = getActiveSessionConfig();

        try {
            if (activeSession?.token) {
                await axios.post(
                    backendUrl + activeSession.logoutEndpoint,
                    {},
                    {
                        headers: { [activeSession.headerName]: activeSession.token },
                        skipSessionRefresh: true,
                    },
                );
            }
        } catch (error) {
            console.log(error);
        } finally {
            clearAllSessions();
        }
    };

    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error?.config || {};
                const activeSession = getActiveSessionConfig();
                const shouldAttemptRefresh = error?.response?.status === 401
                    && !originalRequest._sessionRetried
                    && !originalRequest.skipSessionRefresh
                    && Boolean(activeSession?.refreshToken);

                if (!shouldAttemptRefresh) {
                    return Promise.reject(normalizeAxiosError(error));
                }

                originalRequest._sessionRetried = true;

                try {
                    if (!refreshRequestRef.current) {
                        refreshRequestRef.current = refreshCurrentSession();
                    }

                    const refreshedSession = await refreshRequestRef.current;
                    originalRequest.headers = {
                        ...(originalRequest.headers || {}),
                        [refreshedSession.headerName]: refreshedSession.token,
                    };

                    return axios(originalRequest);
                } catch (refreshError) {
                    clearAllSessions();
                    if (window.location.pathname !== '/') {
                        window.location.assign('/');
                    }
                    return Promise.reject(normalizeAxiosError(refreshError));
                } finally {
                    refreshRequestRef.current = null;
                }
            },
        );

        return () => {
            axios.interceptors.response.eject(interceptorId);
        };
    }, [aToken, aRefreshToken, dToken, dRefreshToken, sToken, sRefreshToken]);

    const value = {
        backendUrl,
        currency,
        slotDateFormat,
        calculateAge,
        isEmergencyMode,
        setIsEmergencyMode,
        isDarkMode,
        setIsDarkMode,
        logoutCurrentSession,
        refreshCurrentSession,
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );

};

export default AppContextProvider;
