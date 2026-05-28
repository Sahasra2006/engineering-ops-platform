const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const createIncident = async (payload, createdBy) => {
    const { title, description, status, severity, impact, root_cause, recovery_steps, project_id, created_by, assigned_user_id } = payload;
    if (!title) throw new ApiError(400, 'title is required');
    const assignee = assigned_user_id !== undefined ? assigned_user_id : created_by;

    if (project_id) {
        const project = await prisma.projects.findUnique({ where: { id: Number(project_id) } });
        if (!project) throw new ApiError(404, 'Project not found');
    }
    if (assignee !== undefined && assignee !== null && assignee !== '') {
        const user = await prisma.users.findUnique({ where: { id: Number(assignee) } });
        if (!user) throw new ApiError(404, 'Assigned user not found');
    }

    return prisma.incidents.create({
        data: {
            title,
            description: description || null,
            status: status || undefined,
            severity: severity || undefined,
            impact: impact || null,
            root_cause: root_cause || null,
            recovery_steps: recovery_steps || null,
            project_id: project_id ? Number(project_id) : null,
            created_by: assignee !== undefined && assignee !== null && assignee !== '' ? Number(assignee) : createdBy
        }
    });
};

const canUpdateIncident = (incident, actor) => {
    if (!actor) return false;
    if (actor.role === 'ADMIN' || actor.role === 'MANAGER') return true;
    if (actor.role === 'DEVELOPER') return incident.created_by === actor.id;
    if (actor.role === 'QA') {
        return incident.created_by === actor.id || ['IDENTIFIED', 'MONITORING'].includes(incident.status || '');
    }
    return false;
};

const updateIncident = async (id, payload, actor) => {
    const incident = await prisma.incidents.findUnique({ where: { id } });
    if (!incident) throw new ApiError(404, 'Incident not found');
    if (!canUpdateIncident(incident, actor)) throw new ApiError(403, 'Forbidden');

    const { title, description, status, severity, impact, root_cause, recovery_steps, created_by, assigned_user_id } = payload;
    const assignee = assigned_user_id !== undefined ? assigned_user_id : created_by;

    if (assignee !== undefined && assignee !== null && assignee !== '') {
        const user = await prisma.users.findUnique({ where: { id: Number(assignee) } });
        if (!user) throw new ApiError(404, 'Assigned user not found');
    }

    return prisma.incidents.update({
        where: { id },
        data: {
            ...(title !== undefined ? { title } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(severity !== undefined ? { severity } : {}),
            ...(impact !== undefined ? { impact } : {}),
            ...(root_cause !== undefined ? { root_cause } : {}),
            ...(recovery_steps !== undefined ? { recovery_steps } : {}),
            ...(assignee !== undefined
                ? { created_by: assignee === null || assignee === '' ? null : Number(assignee) }
                : {})
        }
    });
};

const resolveIncident = async (id) => {
    const incident = await prisma.incidents.findUnique({ where: { id } });
    if (!incident) throw new ApiError(404, 'Incident not found');

    return prisma.incidents.update({
        where: { id },
        data: { status: 'RESOLVED' }
    });
};

const assignIncident = async (id, userId) => {
    const incident = await prisma.incidents.findUnique({ where: { id } });
    if (!incident) throw new ApiError(404, 'Incident not found');
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    // Current schema has no dedicated assignee column, so assignment is tracked by owner field.
    const updated = await prisma.incidents.update({
        where: { id },
        data: { created_by: userId }
    });
    await prisma.notifications.create({
        data: {
            message: `Incident "${updated.title}" assigned to you`,
            type: 'INCIDENT_CREATED',
            user_id: userId
        }
    });
    return updated;
};

const fetchIncidents = async (filters = {}) => {
    const where = {};
    if (filters.project_id) where.project_id = Number(filters.project_id);
    if (filters.created_by) where.created_by = Number(filters.created_by);
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;

    return prisma.incidents.findMany({
        where,
        orderBy: { id: 'asc' }
    });
};

const getIncidentTimeline = async (id) => {
    const incident = await prisma.incidents.findUnique({ where: { id } });
    if (!incident) throw new ApiError(404, 'Incident not found');
    const comments = await prisma.comments.findMany({
        where: { incident_id: id },
        orderBy: { created_at: 'asc' }
    });
    return { incident, comments };
};

const getIncidentAnalytics = async () => {
    const [total, open, investigating, resolved, critical] = await Promise.all([
        prisma.incidents.count(),
        prisma.incidents.count({ where: { status: 'OPEN' } }),
        prisma.incidents.count({ where: { status: 'INVESTIGATING' } }),
        prisma.incidents.count({ where: { status: 'RESOLVED' } }),
        prisma.incidents.count({ where: { severity: 'CRITICAL', status: { not: 'RESOLVED' } } })
    ]);
    return { total, open, investigating, resolved, critical_active: critical };
};

const getIncidentById = async (id) => {
    const incident = await prisma.incidents.findUnique({
        where: { id },
        include: { comments: true, projects: true }
    });
    if (!incident) throw new ApiError(404, 'Incident not found');
    return incident;
};

const deleteIncident = async (id) => {
    const incident = await prisma.incidents.findUnique({ where: { id } });
    if (!incident) throw new ApiError(404, 'Incident not found');
    await prisma.incidents.delete({ where: { id } });
    return true;
};

module.exports = {
    createIncident,
    updateIncident,
    resolveIncident,
    fetchIncidents,
    assignIncident,
    getIncidentTimeline,
    getIncidentAnalytics,
    getIncidentById,
    deleteIncident
};

