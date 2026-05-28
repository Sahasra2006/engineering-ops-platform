const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const createProject = async ({ title, description, status, start_date, end_date }, createdBy) => {
    if (!title) throw new ApiError(400, 'title is required');

    const project = await prisma.projects.create({
        data: {
            title,
            description: description || null,
            status: status || undefined,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null,
            created_by: createdBy
        }
    });

    return project;
};

const getAllProjects = async () => {
    return prisma.projects.findMany({
        orderBy: { id: 'asc' },
        include: {
            project_members: true
        }
    });
};

const getProjectById = async (id) => {
    const project = await prisma.projects.findUnique({
        where: { id },
        include: {
            project_members: true,
            sprints: true,
            tasks: true,
            bugs: true,
            incidents: true
        }
    });
    if (!project) throw new ApiError(404, 'Project not found');
    return project;
};

const deleteProject = async (id) => {
    await getProjectById(id);
    await prisma.projects.delete({ where: { id } });
    return true;
};

const updateProjectStatus = async (id, status) => {
    await getProjectById(id);
    if (!status) throw new ApiError(400, 'status is required');
    return prisma.projects.update({
        where: { id },
        data: { status }
    });
};

const assignProjectMembers = async (id, userIds = []) => {
    await getProjectById(id);
    if (!Array.isArray(userIds) || userIds.length === 0) throw new ApiError(400, 'user_ids must be a non-empty array');

    // Ensure users exist
    const users = await prisma.users.findMany({
        where: { id: { in: userIds.map((u) => Number(u)) } },
        select: { id: true }
    });
    const foundIds = new Set(users.map((u) => u.id));
    const missing = userIds.map((u) => Number(u)).filter((u) => !foundIds.has(u));
    if (missing.length > 0) throw new ApiError(404, `Users not found: ${missing.join(', ')}`);

    const created = await prisma.$transaction(
        userIds.map((userId) =>
            prisma.project_members.upsert({
                where: {
                    project_id_user_id: { project_id: id, user_id: Number(userId) }
                },
                update: {},
                create: { project_id: id, user_id: Number(userId) }
            })
        )
    );

    return created;
};

const removeProjectMember = async (id, userId) => {
    await getProjectById(id);
    const membership = await prisma.project_members.findFirst({
        where: { project_id: id, user_id: userId }
    });
    if (!membership) throw new ApiError(404, 'Project member not found');
    await prisma.project_members.delete({ where: { id: membership.id } });
    return true;
};

const getProjectMembers = async (id) => {
    await getProjectById(id);
    return prisma.project_members.findMany({
        where: { project_id: id },
        include: { users: true }
    });
};

const getProjectAnalytics = async (id) => {
    await getProjectById(id);
    const [totalTasks, doneTasks, totalBugs, openBugs, totalIncidents, resolvedIncidents] = await Promise.all([
        prisma.tasks.count({ where: { project_id: id } }),
        prisma.tasks.count({ where: { project_id: id, status: 'DONE' } }),
        prisma.bugs.count({ where: { project_id: id } }),
        prisma.bugs.count({ where: { project_id: id, status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] } } }),
        prisma.incidents.count({ where: { project_id: id } }),
        prisma.incidents.count({ where: { project_id: id, status: 'RESOLVED' } })
    ]);
    const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
    return {
        project_id: id,
        total_tasks: totalTasks,
        done_tasks: doneTasks,
        progress_percent: progress,
        total_bugs: totalBugs,
        open_bugs: openBugs,
        total_incidents: totalIncidents,
        resolved_incidents: resolvedIncidents
    };
};

const getProjectDashboard = async () => {
    const [active, completed, onHold, planning] = await Promise.all([
        prisma.projects.count({ where: { status: 'ACTIVE' } }),
        prisma.projects.count({ where: { status: 'COMPLETED' } }),
        prisma.projects.count({ where: { status: 'ON_HOLD' } }),
        prisma.projects.count({ where: { status: 'PLANNING' } })
    ]);
    return { active, completed, on_hold: onHold, planning };
};

const updateProject = async (id, payload) => {
    await getProjectById(id);
    const { title, description, status, start_date, end_date } = payload;
    return prisma.projects.update({
        where: { id },
        data: {
            ...(title !== undefined ? { title } : {}),
            ...(description !== undefined ? { description } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(start_date !== undefined ? { start_date: start_date ? new Date(start_date) : null } : {}),
            ...(end_date !== undefined ? { end_date: end_date ? new Date(end_date) : null } : {})
        }
    });
};

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    deleteProject,
    updateProjectStatus,
    assignProjectMembers,
    removeProjectMember,
    getProjectMembers,
    getProjectAnalytics,
    getProjectDashboard,
    updateProject
};

