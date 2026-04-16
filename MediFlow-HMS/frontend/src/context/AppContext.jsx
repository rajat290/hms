import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios';
import { createClientConfig } from "@shared/config/clientConfig.js";
import { registerSessionRefreshInterceptor } from "@shared/http/registerSessionRefreshInterceptor.js";
import { persistStoredSession, readStoredValue } from "@shared/utils/sessionStorage.js";

export const AppContext = createContext();

const AppContextProvider = (props) => {

    const { backendUrl, currency: currencySymbol } = createClientConfig(import.meta.env, {
        defaultCurrency: '\u20B9',
    });

    const [doctors, setDoctors] = useState([]);
    const [token, setToken] = useState(() => readStoredValue('token'));
    const [refreshToken, setRefreshToken] = useState(() => readStoredValue('refreshToken'));
    const [userData, setUserData] = useState(false);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(Boolean(readStoredValue('token')));

    const persistSession = (nextAccessToken, nextRefreshToken) => {
        const { accessToken, refreshToken: storedRefreshToken } = persistStoredSession({
            accessKey: 'token',
            refreshKey: 'refreshToken',
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
        });

        setToken(accessToken);
        setRefreshToken(storedRefreshToken);
    };

    const clearSession = () => {
        persistSession('', '');
        setUserData(false);
    };

    const refreshUserSession = async () => {
        const storedRefreshToken = refreshToken || readStoredValue('refreshToken') || '';

        if (!storedRefreshToken) {
            throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
            backendUrl + '/api/user/refresh-session',
            { refreshToken: storedRefreshToken },
            { skipSessionRefresh: true },
        );

        if (!data.success) {
            throw new Error(data.message || 'Session refresh failed');
        }

        persistSession(data.token, data.refreshToken);
        return data;
    };

    const logout = async () => {
        try {
            if (token) {
                await axios.post(
                    backendUrl + '/api/user/logout',
                    {},
                    {
                        headers: { token },
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

    const loadUserProfileData = async () => {
        if (!token) {
            setProfileLoading(false);
            return;
        }

        setProfileLoading(true);

        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } });

            if (data.success) {
                setUserData(data.userData);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setProfileLoading(false);
        }

    };

    useEffect(() => {
        getDoctosData();
    }, []);

    useEffect(() => {
        if (token) {
            loadUserProfileData();
        } else {
            setUserData(false);
            setProfileLoading(false);
        }
    }, [token]);

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
                token: refreshedSession.token,
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
