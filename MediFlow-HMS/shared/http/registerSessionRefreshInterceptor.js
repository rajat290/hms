const normalizeAxiosError = (error) => {
    const message = error?.response?.data?.message || error?.message || 'Request failed';
    const normalizedError = new Error(message);
    normalizedError.response = error?.response;
    normalizedError.config = error?.config;
    return normalizedError;
};

const registerSessionRefreshInterceptor = ({
    axiosInstance,
    resolveSession,
    refreshSession,
    applyRefreshedSession,
    onSessionExpired,
}) => {
    let refreshRequest = null;

    const interceptorId = axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error?.config || {};
            const activeSession = resolveSession();
            const shouldAttemptRefresh = error?.response?.status === 401
                && !originalRequest._sessionRetried
                && !originalRequest.skipSessionRefresh
                && Boolean(activeSession?.refreshToken);

            if (!shouldAttemptRefresh) {
                return Promise.reject(normalizeAxiosError(error));
            }

            originalRequest._sessionRetried = true;

            try {
                if (!refreshRequest) {
                    refreshRequest = refreshSession(activeSession);
                }

                const refreshedSession = await refreshRequest;
                originalRequest.headers = applyRefreshedSession({
                    headers: originalRequest.headers || {},
                    refreshedSession,
                });

                return axiosInstance(originalRequest);
            } catch (refreshError) {
                await onSessionExpired(refreshError);
                return Promise.reject(normalizeAxiosError(refreshError));
            } finally {
                refreshRequest = null;
            }
        },
    );

    return () => {
        axiosInstance.interceptors.response.eject(interceptorId);
    };
};

export { normalizeAxiosError, registerSessionRefreshInterceptor };
