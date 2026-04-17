const inMemorySession = new Map();

const removeLegacyBrowserValue = (key) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
};

const readStoredValue = (key) => {
    return inMemorySession.get(key) || '';
};

const persistStoredSession = ({ accessKey, refreshKey, accessToken, refreshToken }) => {
    const resolvedAccessToken = accessToken || '';
    const resolvedRefreshToken = refreshToken || '';

    if (resolvedAccessToken) inMemorySession.set(accessKey, resolvedAccessToken);
    else inMemorySession.delete(accessKey);

    if (resolvedRefreshToken) inMemorySession.set(refreshKey, resolvedRefreshToken);
    else inMemorySession.delete(refreshKey);

    removeLegacyBrowserValue(accessKey);
    removeLegacyBrowserValue(refreshKey);

    return {
        accessToken: resolvedAccessToken,
        refreshToken: resolvedRefreshToken,
    };
};

export { persistStoredSession, readStoredValue };
