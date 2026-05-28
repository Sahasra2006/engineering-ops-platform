const asyncHandler = require('../middleware/asyncHandler');
const commentService = require('../services/commentService');
const { sendResponse } = require('../utils/response');

const createComment = asyncHandler(async (req, res) => {
    const comment = await commentService.createComment(req.body, req.user.id);
    return sendResponse(res, { statusCode: 201, message: 'Comment created', data: comment });
});

const getComments = asyncHandler(async (req, res) => {
    const comments = await commentService.getComments(req.query);
    return sendResponse(res, { data: comments });
});

const deleteComment = asyncHandler(async (req, res) => {
    await commentService.deleteComment(Number(req.params.id), req.user.id, req.user.role);
    return sendResponse(res, { message: 'Comment deleted' });
});

module.exports = {
    createComment,
    getComments,
    deleteComment
};

