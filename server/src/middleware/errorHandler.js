const PrismaKnownErrorCodeToHttp = {
    P2002: 409,
    P2025: 404,
    P2003: 400
};

const mapPrismaError = (err) => {
    const code = err?.code;
    if (!code) return null;
    if (code === 'P2002') return { statusCode: 409, message: 'Already exists' };
    if (code === 'P2025') return { statusCode: 404, message: 'Item not found' };
    if (code === 'P2003') return { statusCode: 400, message: 'Invalid related data' };
    return {
        statusCode: PrismaKnownErrorCodeToHttp[code] || 400,
        message: 'Invalid input'
    };
};

const errorHandler = (err, req, res, next) => {
    const prismaMapped = mapPrismaError(err);
    const statusCode = prismaMapped?.statusCode || err.statusCode || 500;
    const fallbackMessage = statusCode >= 500 ? 'Something went wrong. Please try again.' : 'Invalid input';
    const message =
        prismaMapped?.message ||
        (err.isOperational ? err.message : fallbackMessage) ||
        fallbackMessage;

    if (process.env.NODE_ENV !== 'test') {
        console.error(err); // keep full details in server logs only
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
