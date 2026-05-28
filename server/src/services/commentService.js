const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const validateCommentTarget = async ({ task_id, bug_id, incident_id }) => {
    const targets = [task_id, bug_id, incident_id].filter(Boolean);
    if (targets.length !== 1) {
        throw new ApiError(400, 'Exactly one of task_id, bug_id, incident_id is required');
    }

    if (task_id) {
        const task = await prisma.tasks.findUnique({ where: { id: Number(task_id) } });
        if (!task) throw new ApiError(404, 'Task not found');
    }
    if (bug_id) {
        const bug = await prisma.bugs.findUnique({ where: { id: Number(bug_id) } });
        if (!bug) throw new ApiError(404, 'Bug not found');
    }
    if (incident_id) {
        const incident = await prisma.incidents.findUnique({ where: { id: Number(incident_id) } });
        if (!incident) throw new ApiError(404, 'Incident not found');
    }
};

const createComment = async ({ content, task_id, bug_id, incident_id }, userId) => {
    if (!content) throw new ApiError(400, 'content is required');
    await validateCommentTarget({ task_id, bug_id, incident_id });

    return prisma.comments.create({
        data: {
            content,
            user_id: userId,
            task_id: task_id ? Number(task_id) : null,
            bug_id: bug_id ? Number(bug_id) : null,
            incident_id: incident_id ? Number(incident_id) : null
        }
    });
};

const getComments = async (query = {}) => {
    const where = {};
    if (query.task_id) where.task_id = Number(query.task_id);
    if (query.bug_id) where.bug_id = Number(query.bug_id);
    if (query.incident_id) where.incident_id = Number(query.incident_id);

    return prisma.comments.findMany({
        where,
        orderBy: { id: 'desc' }
    });
};

const deleteComment = async (id, userId, role) => {
    const comment = await prisma.comments.findUnique({ where: { id } });
    if (!comment) throw new ApiError(404, 'Comment not found');
    if (comment.user_id !== userId && !['ADMIN', 'MANAGER'].includes(role)) {
        throw new ApiError(403, 'Forbidden');
    }
    await prisma.comments.delete({ where: { id } });
    return true;
};

module.exports = {
    createComment,
    getComments,
    deleteComment
};

