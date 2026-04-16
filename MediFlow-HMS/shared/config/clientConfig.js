const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeUrl = (value, keyName) => {
    const normalizedValue = normalizeString(value);

    if (!normalizedValue) {
        throw new Error(`${keyName} is required`);
    }

    try {
        const parsedUrl = new URL(normalizedValue);
        return parsedUrl.toString().replace(/\/$/, '');
    } catch (error) {
        throw new Error(`${keyName} must be a valid URL`);
    }
};

const createClientConfig = (env, { defaultCurrency = '₹' } = {}) => ({
    backendUrl: normalizeUrl(env.VITE_BACKEND_URL, 'VITE_BACKEND_URL'),
    currency: normalizeString(env.VITE_CURRENCY) || defaultCurrency,
});

export { createClientConfig };
