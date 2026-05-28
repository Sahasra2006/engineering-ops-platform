const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const createTeam = async ({ name, description }, actor) => {
    if (!name) throw new ApiError(400, 'name is required');
    const team = await prisma.teams.create({
        data: { name, description: description || null }
    });
    if (actor?.role === 'MANAGER') {
        await prisma.users.update({
            where: { id: actor.id },
            data: { team_id: team.id }
        });
    }
    return team;
};

const getTeamMetrics = async (memberIds = []) => {
    if (!memberIds.length) return { active_tasks: 0, open_bugs: 0, critical_incidents: 0 };
    const [activeTasks, openBugs, criticalIncidents] = await Promise.all([
        prisma.tasks.count({
            where: {
                assigned_to: { in: memberIds },
                status: { not: 'DONE' }
            }
        }),
        prisma.bugs.count({
            where: {
                OR: [
                    { assigned_to: { in: memberIds } },
                    { reported_by: { in: memberIds } }
                ],
                status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] }
            }
        }),
        prisma.incidents.count({
            where: {
                created_by: { in: memberIds },
                severity: 'CRITICAL',
                status: { not: 'RESOLVED' }
            }
        })
    ]);
    return { active_tasks: activeTasks, open_bugs: openBugs, critical_incidents: criticalIncidents };
};

const getAllTeams = async (actor) => {
    let where = {};
    if (actor?.role === 'MANAGER') where = { users: { some: { id: actor.id } } };
    if ((actor?.role === 'DEVELOPER' || actor?.role === 'QA') && actor?.team_id) where = { id: actor.team_id };
    if ((actor?.role === 'DEVELOPER' || actor?.role === 'QA') && !actor?.team_id) return [];

    const teams = await prisma.teams.findMany({
        where,
        include: {
            users: {
                select: {
                    id: true,
                    full_name: true,
                    role: true,
                    team_id: true
                }
            }
        },
        orderBy: { id: 'asc' }
    });

    const enriched = await Promise.all(
        teams.map(async (team) => {
            const manager = team.users.find((u) => u.role === 'MANAGER') || null;
            const metrics = await getTeamMetrics(team.users.map((u) => u.id));
            return {
                ...team,
                manager,
                total_members: team.users.length,
                ...metrics
            };
        })
    );
    return enriched;
};

const getTeamById = async (id) => {
    const team = await prisma.teams.findUnique({
        where: { id },
        include: { users: true }
    });
    if (!team) throw new ApiError(404, 'Team not found');
    return team;
};

const updateTeam = async (id, { name, description }) => {
    await getTeamById(id);
    return prisma.teams.update({
        where: { id },
        data: {
            ...(name !== undefined ? { name } : {}),
            ...(description !== undefined ? { description } : {})
        }
    });
};

const deleteTeam = async (id) => {
    await getTeamById(id);
    await prisma.teams.delete({ where: { id } });
    return true;
};

const addUserToTeam = async ({ teamId, userId }) => {
    const team = await prisma.teams.findUnique({ where: { id: teamId } });
    if (!team) throw new ApiError(404, 'Team not found');

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: { team_id: teamId }
    });

    const { password_hash, ...safeUser } = updatedUser;
    return safeUser;
};

const removeUserFromTeam = async ({ teamId, userId }) => {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');
    if (user.team_id !== teamId) throw new ApiError(400, 'User does not belong to this team');

    const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: { team_id: null }
    });
    const { password_hash, ...safeUser } = updatedUser;
    return safeUser;
};

const getTeamMembers = async (teamId) => {
    const team = await prisma.teams.findUnique({
        where: { id: teamId },
        include: { users: true }
    });
    if (!team) throw new ApiError(404, 'Team not found');
    return team.users.map(({ password_hash, ...safeUser }) => safeUser);
};

const getTeamStats = async (teamId) => {
    const team = await prisma.teams.findUnique({ where: { id: teamId } });
    if (!team) throw new ApiError(404, 'Team not found');

    const [membersCount, developers, managers, qa] = await Promise.all([
        prisma.users.count({ where: { team_id: teamId } }),
        prisma.users.count({ where: { team_id: teamId, role: 'DEVELOPER' } }),
        prisma.users.count({ where: { team_id: teamId, role: 'MANAGER' } }),
        prisma.users.count({ where: { team_id: teamId, role: 'QA' } })
    ]);

    return {
        team_id: teamId,
        total_members: membersCount,
        developers,
        managers,
        qa
    };
};

const updateTeamLead = async ({ teamId, userId }) => {
    const team = await prisma.teams.findUnique({ where: { id: teamId } });
    if (!team) throw new ApiError(404, 'Team not found');
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    // Since schema has no explicit team_lead column, we keep team lead as MANAGER role in the team.
    const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: { team_id: teamId, role: 'MANAGER' }
    });
    const { password_hash, ...safeUser } = updatedUser;
    return safeUser;
};

module.exports = {
    createTeam,
    getAllTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    addUserToTeam,
    removeUserFromTeam,
    getTeamMembers,
    getTeamStats,
    updateTeamLead
};

