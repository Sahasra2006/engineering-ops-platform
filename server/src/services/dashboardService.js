const prisma = require('../config/prisma');

const getOverview = async () => {
    const [totalUsers, totalTeams, totalProjects, totalTasks, totalBugs, totalIncidents] = await Promise.all([
        prisma.users.count(),
        prisma.teams.count(),
        prisma.projects.count(),
        prisma.tasks.count(),
        prisma.bugs.count(),
        prisma.incidents.count()
    ]);

    return {
        cards: [
            { key: 'users', label: 'Total Users', value: totalUsers },
            { key: 'teams', label: 'Total Teams', value: totalTeams },
            { key: 'projects', label: 'Total Projects', value: totalProjects },
            { key: 'tasks', label: 'Total Tasks', value: totalTasks },
            { key: 'bugs', label: 'Total Bugs', value: totalBugs },
            { key: 'incidents', label: 'Total Incidents', value: totalIncidents }
        ],
        totals: {
            users: totalUsers,
            teams: totalTeams,
            projects: totalProjects,
            tasks: totalTasks,
            bugs: totalBugs,
            incidents: totalIncidents
        }
    };
};

const getProductivityMetrics = async () => {
    const now = new Date();

    const [
        tasksDone,
        tasksTodo,
        tasksInProgress,
        tasksOverdue,
        tasksByPriority,
        bugsOpen,
        bugsResolved,
        bugsCriticalActive,
        bugsBySeverity,
        incidentsActive,
        incidentsResolved,
        incidentsBySeverity
    ] = await Promise.all([
        prisma.tasks.count({ where: { status: 'DONE' } }),
        prisma.tasks.count({ where: { status: 'TODO' } }),
        prisma.tasks.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.tasks.count({ where: { due_date: { lt: now }, status: { not: 'DONE' } } }),
        prisma.tasks.groupBy({ by: ['priority'], _count: { id: true } }),
        prisma.bugs.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] } } }),
        prisma.bugs.count({ where: { status: 'RESOLVED' } }),
        prisma.bugs.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] }, severity: 'CRITICAL' } }),
        prisma.bugs.groupBy({ by: ['severity'], _count: { id: true } }),
        prisma.incidents.count({ where: { status: { not: 'RESOLVED' } } }),
        prisma.incidents.count({ where: { status: 'RESOLVED' } }),
        prisma.incidents.groupBy({ by: ['severity'], _count: { id: true } })
    ]);

    const toChart = (rows, key) =>
        rows
            .filter((r) => r[key] !== null && r[key] !== undefined)
            .map((r) => ({ label: String(r[key]), value: r._count.id }));

    return {
        tasks: {
            cards: [
                { key: 'done', label: 'Completed', value: tasksDone },
                { key: 'todo', label: 'Pending', value: tasksTodo },
                { key: 'in_progress', label: 'In Progress', value: tasksInProgress },
                { key: 'overdue', label: 'Overdue', value: tasksOverdue }
            ],
            charts: {
                by_priority: toChart(tasksByPriority, 'priority')
            }
        },
        bugs: {
            cards: [
                { key: 'open', label: 'Open', value: bugsOpen },
                { key: 'resolved', label: 'Resolved', value: bugsResolved },
                { key: 'critical', label: 'Critical (Active)', value: bugsCriticalActive }
            ],
            charts: {
                by_severity: toChart(bugsBySeverity, 'severity')
            }
        },
        incidents: {
            cards: [
                { key: 'active', label: 'Active', value: incidentsActive },
                { key: 'resolved', label: 'Resolved', value: incidentsResolved }
            ],
            charts: {
                by_severity: toChart(incidentsBySeverity, 'severity')
            }
        }
    };
};

const getWorkloadAnalytics = async ({ overloadedThreshold = 6 } = {}) => {
    const grouped = await prisma.tasks.groupBy({
        by: ['assigned_to'],
        _count: { id: true },
        where: { assigned_to: { not: null }, status: { not: 'DONE' } }
    });

    const userIds = grouped.map((g) => g.assigned_to).filter(Boolean);
    const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, full_name: true, role: true, availability: true, team_id: true }
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const rows = grouped
        .map((g) => {
            const user = userMap.get(g.assigned_to);
            return {
                user_id: g.assigned_to,
                full_name: user?.full_name || 'Unknown',
                role: user?.role || null,
                availability: user?.availability || null,
                team_id: user?.team_id || null,
                assigned_open_tasks: g._count.id
            };
        })
        .sort((a, b) => b.assigned_open_tasks - a.assigned_open_tasks);

    const overloaded = rows.filter((r) => r.assigned_open_tasks >= overloadedThreshold);
    const available = rows.filter((r) => r.availability === 'AVAILABLE');

    return {
        summary: {
            overloaded_threshold: overloadedThreshold,
            total_users_with_assigned_tasks: rows.length,
            overloaded_users: overloaded.length,
            available_users: available.length
        },
        table: rows,
        overloaded_users: overloaded,
        available_users: available
    };
};

const getProjectAnalytics = async () => {
    const [active, completed, totalTasks, doneTasks] = await Promise.all([
        prisma.projects.count({ where: { status: 'ACTIVE' } }),
        prisma.projects.count({ where: { status: 'COMPLETED' } }),
        prisma.tasks.count({ where: { project_id: { not: null } } }),
        prisma.tasks.count({ where: { project_id: { not: null }, status: 'DONE' } })
    ]);

    const completionPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return {
        cards: [
            { key: 'active_projects', label: 'Active Projects', value: active },
            { key: 'completed_projects', label: 'Completed Projects', value: completed },
            { key: 'completion', label: 'Completion %', value: completionPercent }
        ],
        totals: { active, completed, completion_percent: completionPercent }
    };
};

const getSprintAnalytics = async ({ sprintId } = {}) => {
    if (sprintId) {
        const sprint = await prisma.sprints.findUnique({ where: { id: sprintId } });
        if (!sprint) return { summary: {}, sprint: null };

        const [totalTasks, doneTasks, pendingTasks] = await Promise.all([
            prisma.tasks.count({ where: { sprint_id: sprintId } }),
            prisma.tasks.count({ where: { sprint_id: sprintId, status: 'DONE' } }),
            prisma.tasks.count({ where: { sprint_id: sprintId, status: { not: 'DONE' } } })
        ]);
        const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

        return {
            sprint: { id: sprint.id, name: sprint.name, status: sprint.status },
            progress: { percent: progress, total_tasks: totalTasks, completed_tasks: doneTasks, pending_tasks: pendingTasks }
        };
    }

    const [planned, active, completed] = await Promise.all([
        prisma.sprints.count({ where: { status: 'PLANNED' } }),
        prisma.sprints.count({ where: { status: 'ACTIVE' } }),
        prisma.sprints.count({ where: { status: 'COMPLETED' } })
    ]);

    return {
        cards: [
            { key: 'planned', label: 'Planned Sprints', value: planned },
            { key: 'active', label: 'Active Sprints', value: active },
            { key: 'completed', label: 'Completed Sprints', value: completed }
        ],
        totals: { planned, active, completed }
    };
};

module.exports = {
    getOverview,
    getProductivityMetrics,
    getWorkloadAnalytics,
    getProjectAnalytics,
    getSprintAnalytics
};

