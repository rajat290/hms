import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios';
import { persistStoredSession, readStoredValue } from "@shared/utils/sessionStorage.js";

export const AppContext = createContext();

const AppContextProvider = (props) => {

    const currencySymbol = '\u20B9';
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [doctors, setDoctors] = useState([]);
    const [token, setToken] = useState(() => readStoredValue('token'));
    const [refreshToken, setRefreshToken] = useState(() => readStoredValue('refreshToken'));
    const [userData, setUserData] = useState(false);
    const refreshRequestRef = useRef(null);

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

    const normalizeAxiosError = (error) => {
        const message = error?.response?.data?.message || error?.message || 'Request failed';
        const normalizedError = new Error(message);
        normalizedError.response = error?.response;
        normalizedError.config = error?.config;
        return normalizedError;
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
        }

    };

    const loadUserProfileData = async () => {
        if (!token) {
            return;
        }

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
        }
    }, [token]);

    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error?.config || {};
                const shouldAttemptRefresh = error?.response?.status === 401
                    && !originalRequest._sessionRetried
                    && !originalRequest.skipSessionRefresh
                    && Boolean(refreshToken || readStoredValue('refreshToken'));

                if (!shouldAttemptRefresh) {
                    return Promise.reject(normalizeAxiosError(error));
                }

                originalRequest._sessionRetried = true;

                try {
                    if (!refreshRequestRef.current) {
                        refreshRequestRef.current = refreshUserSession();
                    }

                    const refreshedSession = await refreshRequestRef.current;
                    originalRequest.headers = {
                        ...(originalRequest.headers || {}),
                        token: refreshedSession.token,
                    };

                    return axios(originalRequest);
                } catch (refreshError) {
                    clearSession();
                    if (window.location.pathname !== '/login') {
                        window.location.assign('/login');
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
    }, [backendUrl, refreshToken, token]);

    const value = {
        doctors, getDoctosData,
        currencySymbol,
        backendUrl,
        token, setToken,
        refreshToken, setRefreshToken,
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
