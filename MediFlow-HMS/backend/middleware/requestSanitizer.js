const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        return value.replace(/\0/g, '').trim()
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue)
    }

    if (value && typeof value === 'object') {
        Object.keys(value).forEach((key) => {
            value[key] = sanitizeValue(value[key])
        })
    }

    return value
}

const sanitizeRequestInput = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        sanitizeValue(req.body)
    }

    if (req.query && typeof req.query === 'object') {
        sanitizeValue(req.query)
    }

    if (req.params && typeof req.params === 'object') {
        sanitizeValue(req.params)
    }

    next()
}

export default sanitizeRequestInput
