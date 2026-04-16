import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { AdminContext } from "./AdminContext";
import { DoctorContext } from "./DoctorContext";
import { StaffContext } from "./StaffContext";
import { createClientConfig } from "@shared/config/clientConfig.js";
import { registerSessionRefreshInterceptor } from "@shared/http/registerSessionRefreshInterceptor.js";
import { calculateAgeFromDob, formatSlotDate } from "@shared/utils/date.js";

export const AppContext = createContext();

const AppContextProvider = (props) => {

    const { backendUrl, currency } = createClientConfig(import.meta.env, {
        defaultCurrency: '₹',
    });

    const { aToken, aRefreshToken, persistAdminSession, clearAdminSession } = useContext(AdminContext);
    const { dToken, dRefreshToken, persistDoctorSession, clearDoctorSession } = useContext(DoctorContext);
    const { sToken, sRefreshToken, persistStaffSession, clearStaffSession } = useContext(StaffContext);

    const slotDateFormat = formatSlotDate;
    const calculateAge = calculateAgeFromDob;

    const [isEmergencyMode, setIsEmergencyMode] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

    const clearAllSessions = () => {
        clearAdminSession();
        clearDoctorSession();
        clearStaffSession();
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
        return registerSessionRefreshInterceptor({
            axiosInstance: axios,
            resolveSession: () => getActiveSessionConfig(),
            refreshSession: () => refreshCurrentSession(),
            applyRefreshedSession: ({ headers, refreshedSession }) => ({
                ...headers,
                [refreshedSession.headerName]: refreshedSession.token,
            }),
            onSessionExpired: async () => {
                clearAllSessions();
                if (window.location.pathname !== '/') {
                    window.location.assign('/');
                }
            },
        });
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
