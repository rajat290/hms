const readStoredValue = (key) => {
    if (typeof window === 'undefined') {
        return '';
    }

    return window.localStorage.getItem(key) || '';
};

const persistStoredSession = ({ accessKey, refreshKey, accessToken, refreshToken }) => {
    const resolvedAccessToken = accessToken || '';
    const resolvedRefreshToken = refreshToken || '';

    if (typeof window !== 'undefined') {
        if (resolvedAccessToken) window.localStorage.setItem(accessKey, resolvedAccessToken);
        else window.localStorage.removeItem(accessKey);

        if (resolvedRefreshToken) window.localStorage.setItem(refreshKey, resolvedRefreshToken);
        else window.localStorage.removeItem(refreshKey);
    }

    return {
        accessToken: resolvedAccessToken,
        refreshToken: resolvedRefreshToken,
    };
};

export { persistStoredSession, readStoredValue };
