import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { AdminContext } from "./AdminContext";
import { DoctorContext } from "./DoctorContext";
import { StaffContext } from "./StaffContext";
import { createClientConfig } from "@shared/config/clientConfig.js";
import { registerSessionRefreshInterceptor } from "@shared/http/registerSessionRefreshInterceptor.js";
import { calculateAgeFromDob, formatSlotDate } from "@shared/utils/date.js";

export const AppContext = createContext();

const SESSION_PLACEHOLDER = '__cookie_session__';

const AppContextProvider = (props) => {

    const { backendUrl, currency } = createClientConfig(import.meta.env, {
        defaultCurrency: '\u20B9',
    });

    axios.defaults.withCredentials = true;

    const { aToken, aRefreshToken, persistAdminSession, clearAdminSession } = useContext(AdminContext);
    const { dToken, dRefreshToken, persistDoctorSession, clearDoctorSession, setProfileData } = useContext(DoctorContext);
    const { sToken, sRefreshToken, persistStaffSession, clearStaffSession, setStaffProfile } = useContext(StaffContext);

    const slotDateFormat = formatSlotDate;
    const calculateAge = calculateAgeFromDob;

    const [isEmergencyMode, setIsEmergencyMode] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [sessionBootstrapComplete, setSessionBootstrapComplete] = useState(false);

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

        if (!activeSession?.token && !activeSession?.refreshToken) {
            throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
            backendUrl + activeSession.refreshEndpoint,
            {},
            { skipSessionRefresh: true },
        );

        if (!data.success) {
            throw new Error(data.message || 'Session refresh failed');
        }

        activeSession.persistSession();
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
                [refreshedSession.headerName]: refreshedSession.token || SESSION_PLACEHOLDER,
            }),
            onSessionExpired: async () => {
                clearAllSessions();
                if (window.location.pathname !== '/') {
                    window.location.assign('/');
                }
            },
        });
    }, [aToken, aRefreshToken, dToken, dRefreshToken, sToken, sRefreshToken]);

    useEffect(() => {
        const bootstrapRoleSession = async ({
            sessionEndpoint,
            refreshEndpoint,
            persistSession,
            clearSession,
            onSuccess,
        }) => {
            const loadRoleSession = async () => axios.get(backendUrl + sessionEndpoint, { skipSessionRefresh: true });

            try {
                const { data } = await loadRoleSession();
                if (data.success) {
                    persistSession();
                    onSuccess?.(data);
                    return true;
                }
            } catch (error) {
                if (error?.response?.status !== 401) {
                    return false;
                }
            }

            try {
                const refreshResponse = await axios.post(
                    backendUrl + refreshEndpoint,
                    {},
                    { skipSessionRefresh: true },
                );

                if (!refreshResponse.data?.success) {
                    clearSession();
                    return false;
                }

                persistSession();
                const { data } = await loadRoleSession();
                if (data.success) {
                    onSuccess?.(data);
                    return true;
                }
            } catch (error) {
                clearSession();
            }

            return false;
        };

        const bootstrapBackofficeSession = async () => {
            setSessionBootstrapComplete(false);

            const adminActive = await bootstrapRoleSession({
                sessionEndpoint: '/api/admin/session',
                refreshEndpoint: '/api/admin/refresh-session',
                persistSession: persistAdminSession,
                clearSession: clearAdminSession,
            });

            if (adminActive) {
                setSessionBootstrapComplete(true);
                return;
            }

            const doctorActive = await bootstrapRoleSession({
                sessionEndpoint: '/api/doctor/profile',
                refreshEndpoint: '/api/doctor/refresh-session',
                persistSession: persistDoctorSession,
                clearSession: clearDoctorSession,
                onSuccess: (data) => setProfileData(data.profileData),
            });

            if (doctorActive) {
                setSessionBootstrapComplete(true);
                return;
            }

            const staffActive = await bootstrapRoleSession({
                sessionEndpoint: '/api/staff/profile',
                refreshEndpoint: '/api/staff/refresh-session',
                persistSession: persistStaffSession,
                clearSession: clearStaffSession,
                onSuccess: (data) => setStaffProfile(data.staff),
            });

            if (!staffActive) {
                clearAllSessions();
            }

            setSessionBootstrapComplete(true);
        };

        bootstrapBackofficeSession();
    }, [backendUrl]);

    const value = {
        backendUrl,
        currency,
        slotDateFormat,
        calculateAge,
        isEmergencyMode,
        setIsEmergencyMode,
        isDarkMode,
        setIsDarkMode,
        sessionBootstrapComplete,
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
