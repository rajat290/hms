import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios';
import { createClientConfig } from "@shared/config/clientConfig.js";
import { registerSessionRefreshInterceptor } from "@shared/http/registerSessionRefreshInterceptor.js";
import { persistStoredSession, readStoredValue } from "@shared/utils/sessionStorage.js";

export const AppContext = createContext();

const SESSION_PLACEHOLDER = '__cookie_session__';

const AppContextProvider = (props) => {

    const { backendUrl, currency: currencySymbol } = createClientConfig(import.meta.env, {
        defaultCurrency: '\u20B9',
    });

    axios.defaults.withCredentials = true;

    const [doctors, setDoctors] = useState([]);
    const [token, setToken] = useState(() => readStoredValue('token'));
    const [refreshToken, setRefreshToken] = useState(() => readStoredValue('refreshToken'));
    const [userData, setUserData] = useState(false);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);
    const [sessionReady, setSessionReady] = useState(false);

    const persistSession = (nextAccessToken = SESSION_PLACEHOLDER, nextRefreshToken = SESSION_PLACEHOLDER) => {
        const hasSession = Boolean(nextAccessToken || nextRefreshToken);
        const { accessToken, refreshToken: storedRefreshToken } = persistStoredSession({
            accessKey: 'token',
            refreshKey: 'refreshToken',
            accessToken: hasSession ? SESSION_PLACEHOLDER : '',
            refreshToken: hasSession ? SESSION_PLACEHOLDER : '',
        });

        setToken(accessToken);
        setRefreshToken(storedRefreshToken);
    };

    const clearSession = () => {
        persistSession('', '');
        setUserData(false);
    };

    const refreshUserSession = async () => {
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
            backendUrl + '/api/user/refresh-session',
            {},
            { skipSessionRefresh: true },
        );

        if (!data.success) {
            throw new Error(data.message || 'Session refresh failed');
        }

        persistSession();
        return data;
    };

    const logout = async () => {
        try {
            if (token) {
                await axios.post(
                    backendUrl + '/api/user/logout',
                    {},
                    {
                        skipSessionRefresh: true,
                    },
                );
            }
        } catch (error) {
            console.log(error);
        } finally {
            clearSession();
        }
    };

    const getDoctosData = async () => {
        setDoctorsLoading(true);

        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/list');
            if (data.success) {
                setDoctors(data.doctors);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setDoctorsLoading(false);
        }

    };

    const loadUserProfileData = async ({ keepLoading = false } = {}) => {
        if (!keepLoading) {
            setProfileLoading(true);
        }

        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile');

            if (data.success) {
                persistSession();
                setUserData(data.userData);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            setProfileLoading(false);
        }

    };

    const bootstrapUserSession = async () => {
        setProfileLoading(true);

        try {
            await loadUserProfileData({ keepLoading: true });
        } catch (error) {
            const statusCode = error?.response?.status;

            if (statusCode === 401) {
                try {
                    persistSession();
                    await refreshUserSession();
                    await loadUserProfileData({ keepLoading: true });
                } catch (refreshError) {
                    clearSession();
                }
            } else {
                clearSession();
            }
        } finally {
            setSessionReady(true);
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        getDoctosData();
        bootstrapUserSession();
    }, []);

    useEffect(() => {
        if (!sessionReady) {
            return;
        }

        if (token && !userData) {
            loadUserProfileData().catch(() => {
                clearSession();
            });
        } else if (!token) {
            setUserData(false);
            setProfileLoading(false);
        }
    }, [sessionReady, token, userData]);

    useEffect(() => {
        return registerSessionRefreshInterceptor({
            axiosInstance: axios,
            resolveSession: () => ({
                token,
                refreshToken: refreshToken || readStoredValue('refreshToken'),
            }),
            refreshSession: () => refreshUserSession(),
            applyRefreshedSession: ({ headers, refreshedSession }) => ({
                ...headers,
                token: refreshedSession.token || SESSION_PLACEHOLDER,
            }),
            onSessionExpired: async () => {
                clearSession();
                if (window.location.pathname !== '/login') {
                    window.location.assign('/login');
                }
            },
        });
    }, [backendUrl, refreshToken, token]);

    const value = {
        doctors, getDoctosData, getDoctorsData: getDoctosData,
        currencySymbol,
        currency: currencySymbol,
        backendUrl,
        token, setToken,
        refreshToken, setRefreshToken,
        doctorsLoading,
        profileLoading,
        sessionReady,
        isAuthenticated: Boolean(token),
        persistSession,
        clearSession,
        refreshUserSession,
        logout,
        userData, setUserData, loadUserProfileData,
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );

};

export default AppContextProvider;
