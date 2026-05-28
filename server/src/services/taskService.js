const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const createTask = async (payload, createdBy) => {
    const { title, description, due_date, story_points, estimated_hours, project_id, sprint_id, priority, status, assigned_to } = payload;
    if (!title) throw new ApiError(400, 'title is required');
    if (!due_date) throw new ApiError(400, 'due_date is required');

    if (project_id) {
        const project = await prisma.projects.findUnique({ where: { id: Number(project_id) } });
        if (!project) throw new ApiError(404, 'Project not found');
    }
    if (sprint_id) {
        const sprint = await prisma.sprints.findUnique({ where: { id: Number(sprint_id) } });
        if (!sprint) throw new ApiError(404, 'Sprint not found');
    }
    if (assigned_to) {
        const user = await prisma.users.findUnique({ where: { id: Number(assigned_to) } });
        if (!user) throw new ApiError(404, 'Assigned user not found');
    }

    return prisma.tasks.create({
        data: {
            title,
            description: description || null,
            due_date: new Date(due_date),
            story_points: story_points !== undefined ? Number(story_points) : null,
            estimated_hours: estimated_hours !== undefined ? Number(estimated_hours) : null,
            project_id: project_id ? Number(project_id) : null,
            sprint_id: sprint_id ? Number(sprint_id) : null,
            priority: priority || undefined,
            status: status || undefined,
            assigned_to: assigned_to ? Number(assigned_to) : null,
            created_by: createdBy
        }
    });
};

const assignTask = async (id, userId) => {
    const task = await prisma.tasks.findUnique({ where: { id } });
    if (!task) throw new ApiError(404, 'Task not found');
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const updated = await prisma.tasks.update({
        where: { id },
        data: { assigned_to: userId }
    });
    await prisma.notifications.create({
        data: {
            message: `Task "${updated.title}" assigned to you`,
            type: 'TASK_ASSIGNED',
            user_id: userId
        }
    });
    return updated;
};

const updateTaskStatus = async (id, status) => {
    const task = await prisma.tasks.findUnique({ where: { id } });
    if (!task) throw new ApiError(404, 'Task not found');
    if (!status) throw new ApiError(400, 'status is required');
    return prisma.tasks.update({
        where: { id },
        data: { status }
    });
};

const updateTaskPriority = async (id, priority) => {
    const task = await prisma.tasks.findUnique({ where: { id } });
    if (!task) throw new ApiError(404, 'Task not found');
    if (!priority) throw new ApiError(400, 'priority is required');
    return prisma.tasks.update({
        where: { id },
        data: { priority }
    });
};

const fetchTasks = async (filters = {}) => {
    const where = {};
    if (filters.project_id) where.project_id = Number(filters.project_id);
    if (filters.sprint_id) where.sprint_id = Number(filters.sprint_id);
    if (filters.assigned_to) where.assigned_to = Number(filters.assigned_to);
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    return prisma.tasks.findMany({
        where,
        orderBy: { id: 'asc' }
    });
};

const addTaskComment = async (taskId, content, userId) => {
    if (!content) throw new ApiError(400, 'content is required');
    const task = await prisma.tasks.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(404, 'Task not found');

    return prisma.comments.create({
        data: {
            content,
            task_id: taskId,
            user_id: userId
        }
    });
};

const getTaskComments = async (taskId) => {
    const task = await prisma.tasks.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(404, 'Task not found');

    return prisma.comments.findMany({
        where: { task_id: taskId },
        orderBy: { id: 'asc' }
    });
};

const getTaskAnalytics = async () => {
    const now = new Date();
    const [total, todo, inProgress, done, blocked, overdue] = await Promise.all([
        prisma.tasks.count(),
        prisma.tasks.count({ where: { status: 'TODO' } }),
        prisma.tasks.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.tasks.count({ where: { status: 'DONE' } }),
        prisma.tasks.count({ where: { status: 'BLOCKED' } }),
        prisma.tasks.count({ where: { due_date: { lt: now }, status: { not: 'DONE' } } })
    ]);
    return { total, todo, in_progress: inProgress, done, blocked, overdue };
};

const getOverdueTasks = async () => {
    return prisma.tasks.findMany({
        where: {
            due_date: { lt: new Date() },
            status: { not: 'DONE' }
        },
        orderBy: { due_date: 'asc' }
    });
};

const getUserWorkload = async () => {
    const grouped = await prisma.tasks.groupBy({
        by: ['assigned_to'],
        _count: { id: true },
        where: { assigned_to: { not: null }, status: { not: 'DONE' } }
    });
    return grouped;
};

const getTaskById = async (id) => {
    const task = await prisma.tasks.findUnique({
        where: { id },
        include: { comments: true, projects: true, sprints: true }
    });
    if (!task) throw new ApiError(404, 'Task not found');
    return task;
};

const updateTask = async (id, payload) => {
    const existing = await prisma.tasks.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Task not found');

    const {
        title,
        description,
        due_date,
        story_points,
        estimated_hours,
        actual_hours,
        sprint_id,
        project_id,
        assigned_to,
        status,
        priority
    } = payload;

    if (project_id !== undefined && project_id !== null) {
        const project = await prisma.projects.findUnique({ where: { id: Number(project_id) } });
        if (!project) throw new ApiError(404, 'Project not found');
    }
    if (sprint_id !== undefined && sprint_id !== null) {
        const sprint = await prisma.sprints.findUnique({ where: { id: Number(sprint_id) } });
        if (!sprint) throw new ApiError(404, 'Sprint not found');
    }
    if (assigned_to !== undefined && assigned_to !== null) {
        const user = await prisma.users.findUnique({ where: { id: Number(assigned_to) } });
        if (!user) throw new ApiError(404, 'Assigned user not found');
    }

    return prisma.tasks.update({
        where: { id },
        data: {
            ...(title !== undefined ? { title } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(due_date !== undefined ? { due_date: due_date ? new Date(due_date) : null } : {}),
            ...(story_points !== undefined ? { story_points: story_points === null ? null : Number(story_points) } : {}),
            ...(estimated_hours !== undefined ? { estimated_hours: estimated_hours === null ? null : Number(estimated_hours) } : {}),
            ...(actual_hours !== undefined ? { actual_hours: actual_hours === null ? null : Number(actual_hours) } : {}),
            ...(sprint_id !== undefined ? { sprint_id: sprint_id === null ? null : Number(sprint_id) } : {}),
            ...(project_id !== undefined ? { project_id: project_id === null ? null : Number(project_id) } : {}),
            ...(assigned_to !== undefined ? { assigned_to: assigned_to === null ? null : Number(assigned_to) } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(priority !== undefined ? { priority } : {})
        }
    });
};

const deleteTask = async (id) => {
    const task = await prisma.tasks.findUnique({ where: { id } });
    if (!task) throw new ApiError(404, 'Task not found');
    await prisma.tasks.delete({ where: { id } });
    return true;
};

module.exports = {
    createTask,
    assignTask,
    updateTaskStatus,
    updateTaskPriority,
    fetchTasks,
    addTaskComment,
    getTaskComments,
    getTaskAnalytics,
    getOverdueTasks,
    getUserWorkload,
    getTaskById,
    updateTask,
    deleteTask
};

