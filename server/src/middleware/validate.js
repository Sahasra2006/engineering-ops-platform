const ApiError = require('../utils/ApiError');

const requireBodyFields = (fields = []) => {
    return (req, res, next) => {
        const missing = fields.filter((f) => req.body?.[f] === undefined || req.body?.[f] === null || req.body?.[f] === '');
        if (missing.length > 0) {
            return next(new ApiError(400, `Missing required fields: ${missing.join(', ')}`));
        }
        return next();
    };
};

module.exports = {
    requireBodyFields
};

