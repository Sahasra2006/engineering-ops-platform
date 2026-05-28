const sendResponse = (res, { statusCode = 200, success = true, message, data }) => {
    const payload = { success };
    if (message) payload.message = message;
    if (data !== undefined) payload.data = data;
    return res.status(statusCode).json(payload);
};

module.exports = {
    sendResponse
};

