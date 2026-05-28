const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const createSprint = async ({ name, goal, status, start_date, end_date, project_id }) => {
    if (!name) throw new ApiError(400, 'name is required');
    if (!project_id) throw new ApiError(400, 'project_id is required');

    const project = await prisma.projects.findUnique({ where: { id: Number(project_id) } });
    if (!project) throw new ApiError(404, 'Project not found');

    return prisma.sprints.create({
        data: {
            name,
            goal: goal || null,
            status: status || undefined,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null,
            project_id: Number(project_id)
        }
    });
};

const updateSprint = async (id, payload) => {
    const sprint = await prisma.sprints.findUnique({ where: { id } });
    if (!sprint) throw new ApiError(404, 'Sprint not found');

    const { name, goal, status, start_date, end_date } = payload;
    return prisma.sprints.update({
        where: { id },
        data: {
            ...(name !== undefined ? { name } : {}),
            ...(goal !== undefined ? { goal } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(start_date !== undefined ? { start_date: start_date ? new Date(start_date) : null } : {}),
            ...(end_date !== undefined ? { end_date: end_date ? new Date(end_date) : null } : {})
        }
    });
};

const getSprintTasks = async (id) => {
    const sprint = await prisma.sprints.findUnique({ where: { id } });
    if (!sprint) throw new ApiError(404, 'Sprint not found');

    return prisma.tasks.findMany({
        where: { sprint_id: id },
        orderBy: { id: 'asc' }
    });
};

const completeSprint = async (id) => {
    const sprint = await prisma.sprints.findUnique({ where: { id } });
    if (!sprint) throw new ApiError(404, 'Sprint not found');

    return prisma.sprints.update({
        where: { id },
        data: { status: 'COMPLETED' }
    });
};

const moveTaskBetweenSprints = async (taskId, toSprintId) => {
    const task = await prisma.tasks.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(404, 'Task not found');
    const sprint = await prisma.sprints.findUnique({ where: { id: toSprintId } });
    if (!sprint) throw new ApiError(404, 'Target sprint not found');
    return prisma.tasks.update({
        where: { id: taskId },
        data: { sprint_id: toSprintId }
    });
};

const getSprintAnalytics = async (id) => {
    const sprint = await prisma.sprints.findUnique({ where: { id } });
    if (!sprint) throw new ApiError(404, 'Sprint not found');
    const [totalTasks, doneTasks, blockedTasks] = await Promise.all([
        prisma.tasks.count({ where: { sprint_id: id } }),
        prisma.tasks.count({ where: { sprint_id: id, status: 'DONE' } }),
        prisma.tasks.count({ where: { sprint_id: id, status: 'BLOCKED' } })
    ]);
    const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
    return {
        sprint_id: id,
        total_tasks: totalTasks,
        done_tasks: doneTasks,
        blocked_tasks: blockedTasks,
        progress_percent: progress
    };
};

const getAllSprints = async (filters = {}) => {
    const where = {};
    if (filters.project_id) where.project_id = Number(filters.project_id);
    if (filters.status) where.status = filters.status;

    return prisma.sprints.findMany({
        where,
        orderBy: { id: 'asc' }
    });
};

const getSprintById = async (id) => {
    const sprint = await prisma.sprints.findUnique({
        where: { id },
        include: { tasks: true, projects: true }
    });
    if (!sprint) throw new ApiError(404, 'Sprint not found');
    return sprint;
};

const deleteSprint = async (id) => {
    const sprint = await prisma.sprints.findUnique({ where: { id } });
    if (!sprint) throw new ApiError(404, 'Sprint not found');
    await prisma.sprints.delete({ where: { id } });
    return true;
};

module.exports = {
    createSprint,
    updateSprint,
    getSprintTasks,
    completeSprint,
    moveTaskBetweenSprints,
    getSprintAnalytics,
    getAllSprints,
    getSprintById,
    deleteSprint
};

