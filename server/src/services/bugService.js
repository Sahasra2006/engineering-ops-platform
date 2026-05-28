const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const reportBug = async (payload, reportedBy) => {
    const { title, description, severity, screenshot, project_id, assigned_to, status } = payload;
    if (!title) throw new ApiError(400, 'title is required');

    if (project_id) {
        const project = await prisma.projects.findUnique({ where: { id: Number(project_id) } });
        if (!project) throw new ApiError(404, 'Project not found');
    }
    if (assigned_to) {
        const user = await prisma.users.findUnique({ where: { id: Number(assigned_to) } });
        if (!user) throw new ApiError(404, 'Assigned user not found');
    }

    return prisma.bugs.create({
        data: {
            title,
            description: description || null,
            severity: severity || undefined,
            status: status || undefined,
            screenshot: screenshot || null,
            project_id: project_id ? Number(project_id) : null,
            reported_by: reportedBy,
            assigned_to: assigned_to ? Number(assigned_to) : null
        }
    });
};

const assignBug = async (id, userId) => {
    const bug = await prisma.bugs.findUnique({ where: { id } });
    if (!bug) throw new ApiError(404, 'Bug not found');

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const updated = await prisma.bugs.update({
        where: { id },
        data: { assigned_to: userId }
    });
    await prisma.notifications.create({
        data: {
            message: `Bug "${updated.title}" assigned to you`,
            type: 'BUG_REPORTED',
            user_id: userId
        }
    });
    return updated;
};

const updateBugStatus = async (id, status) => {
    const bug = await prisma.bugs.findUnique({ where: { id } });
    if (!bug) throw new ApiError(404, 'Bug not found');
    if (!status) throw new ApiError(400, 'status is required');

    return prisma.bugs.update({
        where: { id },
        data: { status }
    });
};

const updateBugSeverity = async (id, severity) => {
    const bug = await prisma.bugs.findUnique({ where: { id } });
    if (!bug) throw new ApiError(404, 'Bug not found');
    if (!severity) throw new ApiError(400, 'severity is required');

    return prisma.bugs.update({
        where: { id },
        data: { severity }
    });
};

const fetchBugs = async (filters = {}) => {
    const where = {};
    if (filters.project_id) where.project_id = Number(filters.project_id);
    if (filters.reported_by) where.reported_by = Number(filters.reported_by);
    if (filters.assigned_to) where.assigned_to = Number(filters.assigned_to);
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;

    return prisma.bugs.findMany({
        where,
        orderBy: { id: 'asc' }
    });
};

const reopenBug = async (id) => {
    const bug = await prisma.bugs.findUnique({ where: { id } });
    if (!bug) throw new ApiError(404, 'Bug not found');
    return prisma.bugs.update({
        where: { id },
        data: { status: 'REOPENED' }
    });
};

const getBugAnalytics = async () => {
    const [total, open, inProgress, resolved, closed, criticalOpen] = await Promise.all([
        prisma.bugs.count(),
        prisma.bugs.count({ where: { status: 'OPEN' } }),
        prisma.bugs.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.bugs.count({ where: { status: 'RESOLVED' } }),
        prisma.bugs.count({ where: { status: 'CLOSED' } }),
        prisma.bugs.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] }, severity: 'CRITICAL' } })
    ]);
    return { total, open, in_progress: inProgress, resolved, closed, critical_open: criticalOpen };
};

const getBugById = async (id) => {
    const bug = await prisma.bugs.findUnique({
        where: { id },
        include: { comments: true, projects: true }
    });
    if (!bug) throw new ApiError(404, 'Bug not found');
    return bug;
};

const updateBug = async (id, payload) => {
    const bug = await prisma.bugs.findUnique({ where: { id } });
    if (!bug) throw new ApiError(404, 'Bug not found');

    const { title, description, severity, status, screenshot, project_id, assigned_to } = payload;

    if (project_id !== undefined && project_id !== null) {
        const project = await prisma.projects.findUnique({ where: { id: Number(project_id) } });
        if (!project) throw new ApiError(404, 'Project not found');
    }
    if (assigned_to !== undefined && assigned_to !== null) {
        const user = await prisma.users.findUnique({ where: { id: Number(assigned_to) } });
        if (!user) throw new ApiError(404, 'Assigned user not found');
    }

    return prisma.bugs.update({
        where: { id },
        data: {
            ...(title !== undefined ? { title } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(severity !== undefined ? { severity } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(screenshot !== undefined ? { screenshot } : {}),
            ...(project_id !== undefined ? { project_id: project_id === null ? null : Number(project_id) } : {}),
            ...(assigned_to !== undefined ? { assigned_to: assigned_to === null ? null : Number(assigned_to) } : {})
        }
    });
};

const deleteBug = async (id) => {
    const bug = await prisma.bugs.findUnique({ where: { id } });
    if (!bug) throw new ApiError(404, 'Bug not found');
    await prisma.bugs.delete({ where: { id } });
    return true;
};

module.exports = {
    reportBug,
    assignBug,
    updateBugStatus,
    updateBugSeverity,
    fetchBugs,
    reopenBug,
    getBugAnalytics,
    getBugById,
    updateBug,
    deleteBug
};

