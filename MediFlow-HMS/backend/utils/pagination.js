import { sendSuccess } from './apiResponse.js';

const parsePaginationQuery = (query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) => {
    const rawPage = Number.parseInt(query.page, 10);
    const rawLimit = Number.parseInt(query.limit, 10);

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const requestedLimit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit;
    const limit = Math.min(requestedLimit, maxLimit);

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

const buildPaginationMeta = ({ page, limit, totalItems }) => {
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
        page,
        limit,
        totalItems,
        totalPages,
        count: totalItems === 0 ? 0 : Math.min(limit, Math.max(totalItems - ((page - 1) * limit), 0)),
        hasNextPage: totalPages > 0 && page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
    };
};

const sendPaginatedResponse = (
    res,
    {
        message,
        itemKey,
        items,
        page,
        limit,
        totalItems,
        additionalData = {},
        statusCode = 200,
    },
) => {
    const meta = buildPaginationMeta({ page, limit, totalItems });

    return sendSuccess(
        res,
        {
            message,
            data: {
                [itemKey]: items,
                ...additionalData,
            },
            meta,
            [itemKey]: items,
            ...additionalData,
        },
        statusCode,
    );
};

export {
    buildPaginationMeta,
    parsePaginationQuery,
    sendPaginatedResponse,
};
