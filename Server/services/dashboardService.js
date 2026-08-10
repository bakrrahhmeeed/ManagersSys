const sql = require("mssql");
const Roles = require("../constants/roles");



const dashboard = async (user) => {

    let stats = {};
    let latestProjects = [];
    let chartData = {};
    let activities = [];
    let notifications = [];



    // =========================================================
    // ADMIN / PMO MANAGER
    // =========================================================

    if (
        user.RoleName === Roles.ADMIN ||
        user.RoleName === Roles.PMO_MANAGER
    ) {

        const [
            projects,
            users,
            tasks,
            overdueTasks,
            completedTasks
        ] = await Promise.all([

            sql.query`
                SELECT COUNT(*) AS Total
                FROM Projects
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM Users
                WHERE IsActive = 1
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks
                WHERE
                    DueDate IS NOT NULL
                    AND DueDate < CAST(GETDATE() AS DATE)
                    AND Status <> 'Completed'
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks
                WHERE Status = 'Completed'
            `
        ]);


        stats = {
            projects: projects.recordset[0].Total,
            tasks: tasks.recordset[0].Total,
            users: users.recordset[0].Total,
            overdueTasks: overdueTasks.recordset[0].Total,
            completedTasks: completedTasks.recordset[0].Total
        };


        // Recent Projects
        const latestProjectsResult = await sql.query`

            SELECT TOP 5

                p.ProjectID,
                p.ProjectName,
                p.Status,

                CAST(
                    COALESCE(
                        AVG(CAST(t.ProgressPercent AS FLOAT)),
                        p.ProgressPercent,
                        0
                    )
                AS DECIMAL(5,2)) AS Progress,

                u.FullName AS ProjectManager,

                p.TargetEndDate AS DueDate

            FROM Projects p

            LEFT JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            GROUP BY
                p.ProjectID,
                p.ProjectName,
                p.Status,
                p.ProgressPercent,
                p.TargetEndDate,
                u.FullName

            ORDER BY p.ProjectID DESC
        `;

        latestProjects = latestProjectsResult.recordset;
    }



    // =========================================================
    // DEPARTMENT MANAGER
    // =========================================================

    else if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        const [
            projects,
            users,
            tasks,
            overdueTasks,
            completedTasks
        ] = await Promise.all([

            sql.query`
                SELECT COUNT(DISTINCT p.ProjectID) AS Total
                FROM Projects p
                INNER JOIN ProjectDepartments pd
                    ON p.ProjectID = pd.ProjectID
                WHERE pd.DepartmentID = ${user.DepartmentID}
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM Users
                WHERE
                    DepartmentID = ${user.DepartmentID}
                    AND IsActive = 1
            `,

            sql.query`
                SELECT COUNT(DISTINCT t.TaskID) AS Total
                FROM ProjectTasks t
                INNER JOIN ProjectDepartments pd
                    ON t.ProjectID = pd.ProjectID
                WHERE pd.DepartmentID = ${user.DepartmentID}
            `,

            sql.query`
                SELECT COUNT(DISTINCT t.TaskID) AS Total
                FROM ProjectTasks t
                INNER JOIN ProjectDepartments pd
                    ON t.ProjectID = pd.ProjectID
                WHERE
                    pd.DepartmentID = ${user.DepartmentID}
                    AND t.DueDate IS NOT NULL
                    AND t.DueDate < CAST(GETDATE() AS DATE)
                    AND t.Status <> 'Completed'
            `,

            sql.query`
                SELECT COUNT(DISTINCT t.TaskID) AS Total
                FROM ProjectTasks t
                INNER JOIN ProjectDepartments pd
                    ON t.ProjectID = pd.ProjectID
                WHERE
                    pd.DepartmentID = ${user.DepartmentID}
                    AND t.Status = 'Completed'
            `
        ]);


        stats = {
            projects: projects.recordset[0].Total,
            tasks: tasks.recordset[0].Total,
            users: users.recordset[0].Total,
            overdueTasks: overdueTasks.recordset[0].Total,
            completedTasks: completedTasks.recordset[0].Total
        };


        // Recent Projects
        const latestProjectsResult = await sql.query`

            SELECT DISTINCT TOP 5

                p.ProjectID,
                p.ProjectName,
                p.Status,

                CAST(
                    COALESCE(
                        (
                            SELECT AVG(
                                CAST(t2.ProgressPercent AS FLOAT)
                            )
                            FROM ProjectTasks t2
                            WHERE t2.ProjectID = p.ProjectID
                        ),
                        p.ProgressPercent,
                        0
                    )
                AS DECIMAL(5,2)) AS Progress,

                u.FullName AS ProjectManager,

                p.TargetEndDate AS DueDate

            FROM Projects p

            INNER JOIN ProjectDepartments pd
                ON p.ProjectID = pd.ProjectID

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            WHERE pd.DepartmentID = ${user.DepartmentID}

            ORDER BY p.ProjectID DESC
        `;

        latestProjects = latestProjectsResult.recordset;
    }



    // =========================================================
    // PROJECT MANAGER
    // =========================================================

    else if (user.RoleName === Roles.PROJECT_MANAGER) {

        const [
            projects,
            users,
            tasks,
            overdueTasks,
            completedTasks
        ] = await Promise.all([

            sql.query`
                SELECT COUNT(*) AS Total
                FROM Projects
                WHERE ProjectManagerID = ${user.UserID}
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM Users
                WHERE IsActive = 1
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks t
                INNER JOIN Projects p
                    ON t.ProjectID = p.ProjectID
                WHERE p.ProjectManagerID = ${user.UserID}
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks t
                INNER JOIN Projects p
                    ON t.ProjectID = p.ProjectID
                WHERE
                    p.ProjectManagerID = ${user.UserID}
                    AND t.DueDate IS NOT NULL
                    AND t.DueDate < CAST(GETDATE() AS DATE)
                    AND t.Status <> 'Completed'
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks t
                INNER JOIN Projects p
                    ON t.ProjectID = p.ProjectID
                WHERE
                    p.ProjectManagerID = ${user.UserID}
                    AND t.Status = 'Completed'
            `
        ]);


        stats = {
            projects: projects.recordset[0].Total,
            tasks: tasks.recordset[0].Total,
            users: users.recordset[0].Total,
            overdueTasks: overdueTasks.recordset[0].Total,
            completedTasks: completedTasks.recordset[0].Total
        };


        // Recent Projects
        const latestProjectsResult = await sql.query`

            SELECT TOP 5

                p.ProjectID,
                p.ProjectName,
                p.Status,

                CAST(
                    COALESCE(
                        AVG(CAST(t.ProgressPercent AS FLOAT)),
                        p.ProgressPercent,
                        0
                    )
                AS DECIMAL(5,2)) AS Progress,

                u.FullName AS ProjectManager,

                p.TargetEndDate AS DueDate

            FROM Projects p

            LEFT JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            WHERE p.ProjectManagerID = ${user.UserID}

            GROUP BY
                p.ProjectID,
                p.ProjectName,
                p.Status,
                p.ProgressPercent,
                p.TargetEndDate,
                u.FullName

            ORDER BY p.ProjectID DESC
        `;

        latestProjects = latestProjectsResult.recordset;
    }



    // =========================================================
    // EMPLOYEE / OTHER ROLES
    // =========================================================

    else {

        const [
            projects,
            tasks,
            overdueTasks,
            completedTasks
        ] = await Promise.all([

            sql.query`
                SELECT COUNT(DISTINCT ProjectID) AS Total
                FROM ProjectTasks
                WHERE AssignedTo = ${user.UserID}
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks
                WHERE AssignedTo = ${user.UserID}
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks
                WHERE
                    AssignedTo = ${user.UserID}
                    AND DueDate IS NOT NULL
                    AND DueDate < CAST(GETDATE() AS DATE)
                    AND Status <> 'Completed'
            `,

            sql.query`
                SELECT COUNT(*) AS Total
                FROM ProjectTasks
                WHERE
                    AssignedTo = ${user.UserID}
                    AND Status = 'Completed'
            `
        ]);


        stats = {
            projects: projects.recordset[0].Total,
            tasks: tasks.recordset[0].Total,
            users: 0,
            overdueTasks: overdueTasks.recordset[0].Total,
            completedTasks: completedTasks.recordset[0].Total
        };


        // Recent Projects
        const latestProjectsResult = await sql.query`

            SELECT DISTINCT TOP 5

                p.ProjectID,
                p.ProjectName,
                p.Status,

                CAST(
                    COALESCE(
                        (
                            SELECT AVG(
                                CAST(t2.ProgressPercent AS FLOAT)
                            )
                            FROM ProjectTasks t2
                            WHERE
                                t2.ProjectID = p.ProjectID
                                AND t2.AssignedTo = ${user.UserID}
                        ),
                        0
                    )
                AS DECIMAL(5,2)) AS Progress,

                u.FullName AS ProjectManager,

                p.TargetEndDate AS DueDate

            FROM Projects p

            INNER JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            WHERE t.AssignedTo = ${user.UserID}

            ORDER BY p.ProjectID DESC
        `;

        latestProjects = latestProjectsResult.recordset;
    }



    // =========================================================
    // OVERALL PROJECT PROGRESS
    // =========================================================

    const progressData = await getProgress(user);

    chartData = {
        overallProgress: progressData.overallProgress
    };



    return {
        stats,
        latestProjects,
        chartData,
        activities,
        notifications
    };
};


const getProgress = async (user) => {
    let result;

    // =========================================================
    // ADMIN / PMO MANAGER
    // =========================================================
    if (
        user.RoleName === Roles.ADMIN ||
        user.RoleName === Roles.PMO_MANAGER
    ) {
        result = await sql.query`
            SELECT
                p.ProjectID,
                p.ProjectName,
                p.Status,

                u.FullName AS Manager,
                p.TargetEndDate AS DueDate,

                COUNT(DISTINCT t.TaskID) AS TotalTasks,

                COUNT(
                    DISTINCT CASE
                        WHEN t.Status = 'Completed'
                        THEN t.TaskID
                    END
                ) AS CompletedTasks,

                COUNT(DISTINCT i.IssueID) AS TotalIssues,

                COUNT(
                    DISTINCT CASE
                        WHEN i.Status IN ('Resolved', 'Closed')
                        THEN i.IssueID
                    END
                ) AS ResolvedIssues,

                COUNT(DISTINCT r.RiskID) AS TotalRisks,

                COUNT(
                    DISTINCT CASE
                        WHEN r.Status = 'Closed'
                        THEN r.RiskID
                    END
                ) AS ClosedRisks

            FROM Projects p

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            LEFT JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            LEFT JOIN Issues i
                ON p.ProjectID = i.ProjectID

            LEFT JOIN Risks r
                ON p.ProjectID = r.ProjectID

            GROUP BY
                p.ProjectID,
                p.ProjectName,
                p.Status,
                p.TargetEndDate,
                u.FullName

            ORDER BY p.ProjectID DESC
        `;
    }

    // =========================================================
    // DEPARTMENT MANAGER
    // =========================================================
    else if (user.RoleName === Roles.DEPARTMENT_MANAGER) {
        result = await sql.query`
            SELECT
                p.ProjectID,
                p.ProjectName,
                p.Status,

                u.FullName AS Manager,
                p.TargetEndDate AS DueDate,

                COUNT(DISTINCT t.TaskID) AS TotalTasks,

                COUNT(
                    DISTINCT CASE
                        WHEN t.Status = 'Completed'
                        THEN t.TaskID
                    END
                ) AS CompletedTasks,

                COUNT(DISTINCT i.IssueID) AS TotalIssues,

                COUNT(
                    DISTINCT CASE
                        WHEN i.Status IN ('Resolved', 'Closed')
                        THEN i.IssueID
                    END
                ) AS ResolvedIssues,

                COUNT(DISTINCT r.RiskID) AS TotalRisks,

                COUNT(
                    DISTINCT CASE
                        WHEN r.Status = 'Closed'
                        THEN r.RiskID
                    END
                ) AS ClosedRisks

            FROM Projects p

            INNER JOIN ProjectDepartments pd
                ON p.ProjectID = pd.ProjectID

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            LEFT JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            LEFT JOIN Issues i
                ON p.ProjectID = i.ProjectID

            LEFT JOIN Risks r
                ON p.ProjectID = r.ProjectID

            WHERE pd.DepartmentID = ${user.DepartmentID}

            GROUP BY
                p.ProjectID,
                p.ProjectName,
                p.Status,
                p.TargetEndDate,
                u.FullName

            ORDER BY p.ProjectID DESC
        `;
    }

    // =========================================================
    // PROJECT MANAGER
    // =========================================================
    else if (user.RoleName === Roles.PROJECT_MANAGER) {
        result = await sql.query`
            SELECT
                p.ProjectID,
                p.ProjectName,
                p.Status,

                u.FullName AS Manager,
                p.TargetEndDate AS DueDate,

                COUNT(DISTINCT t.TaskID) AS TotalTasks,

                COUNT(
                    DISTINCT CASE
                        WHEN t.Status = 'Completed'
                        THEN t.TaskID
                    END
                ) AS CompletedTasks,

                COUNT(DISTINCT i.IssueID) AS TotalIssues,

                COUNT(
                    DISTINCT CASE
                        WHEN i.Status IN ('Resolved', 'Closed')
                        THEN i.IssueID
                    END
                ) AS ResolvedIssues,

                COUNT(DISTINCT r.RiskID) AS TotalRisks,

                COUNT(
                    DISTINCT CASE
                        WHEN r.Status = 'Closed'
                        THEN r.RiskID
                    END
                ) AS ClosedRisks

            FROM Projects p

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            LEFT JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            LEFT JOIN Issues i
                ON p.ProjectID = i.ProjectID

            LEFT JOIN Risks r
                ON p.ProjectID = r.ProjectID

            WHERE p.ProjectManagerID = ${user.UserID}

            GROUP BY
                p.ProjectID,
                p.ProjectName,
                p.Status,
                p.TargetEndDate,
                u.FullName

            ORDER BY p.ProjectID DESC
        `;
    }

    // =========================================================
    // EMPLOYEE / TEAM MEMBER
    // =========================================================
    else {
        result = await sql.query`
            SELECT
                p.ProjectID,
                p.ProjectName,
                p.Status,

                u.FullName AS Manager,
                p.TargetEndDate AS DueDate,

                COUNT(DISTINCT t.TaskID) AS TotalTasks,

                COUNT(
                    DISTINCT CASE
                        WHEN t.Status = 'Completed'
                        THEN t.TaskID
                    END
                ) AS CompletedTasks,

                COUNT(DISTINCT i.IssueID) AS TotalIssues,

                COUNT(
                    DISTINCT CASE
                        WHEN i.Status IN ('Resolved', 'Closed')
                        THEN i.IssueID
                    END
                ) AS ResolvedIssues,

                COUNT(DISTINCT r.RiskID) AS TotalRisks,

                COUNT(
                    DISTINCT CASE
                        WHEN r.Status = 'Closed'
                        THEN r.RiskID
                    END
                ) AS ClosedRisks

            FROM Projects p

            INNER JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID
                AND t.AssignedTo = ${user.UserID}

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            LEFT JOIN Issues i
                ON p.ProjectID = i.ProjectID

            LEFT JOIN Risks r
                ON p.ProjectID = r.ProjectID

            GROUP BY
                p.ProjectID,
                p.ProjectName,
                p.Status,
                p.TargetEndDate,
                u.FullName

            ORDER BY p.ProjectID DESC
        `;
    }

    // =========================================================
    // CALCULATE PROJECT PROGRESS
    // =========================================================

    const projects = result.recordset.map((project) => {

        const totalTasks = Number(project.TotalTasks);
        const completedTasks = Number(project.CompletedTasks);

        const totalIssues = Number(project.TotalIssues);
        const resolvedIssues = Number(project.ResolvedIssues);

        const totalRisks = Number(project.TotalRisks);
        const closedRisks = Number(project.ClosedRisks);

        // Tasks Progress
        const taskProgress =
            totalTasks === 0
                ? 100
                : (completedTasks / totalTasks) * 100;

        // Issues Progress
        const issueProgress =
            totalIssues === 0
                ? 100
                : (resolvedIssues / totalIssues) * 100;

        // Risks Progress
        const riskProgress =
            totalRisks === 0
                ? 100
                : (closedRisks / totalRisks) * 100;

        // Overall Progress
        const overallProgress =
            (taskProgress * 0.50) +
            (issueProgress * 0.25) +
            (riskProgress * 0.25);

        return {
            projectId: project.ProjectID,
            projectName: project.ProjectName,
            status: project.Status,

            // NEW
            manager: project.Manager || null,
            dueDate: project.DueDate || null,

            totalTasks,
            completedTasks,

            taskProgress: Number(
                taskProgress.toFixed(2)
            ),

            totalIssues,
            resolvedIssues,

            issueProgress: Number(
                issueProgress.toFixed(2)
            ),

            totalRisks,
            closedRisks,

            riskProgress: Number(
                riskProgress.toFixed(2)
            ),

            overallProgress: Number(
                overallProgress.toFixed(2)
            )
        };
    });

    // =========================================================
    // OVERALL PROGRESS FOR ALL VISIBLE PROJECTS
    // =========================================================

    const overallProgress =
        projects.length === 0
            ? 0
            : projects.reduce(
                (sum, project) =>
                    sum + project.overallProgress,
                0
            ) / projects.length;

    return {
        overallProgress: Number(
            overallProgress.toFixed(2)
        ),

        projects
    };
};

const getTaskStatus = async (user) => {

    let result;



    // ADMIN + PMO MANAGER
    if (
        user.RoleName === Roles.ADMIN ||
        user.RoleName === Roles.PMO_MANAGER
    ) {

        result = await sql.query`

            SELECT
                CASE
                    WHEN t.Status = 'Completed'
                        THEN 'Completed'

                    WHEN t.DueDate IS NOT NULL
                         AND t.DueDate < CAST(GETDATE() AS DATE)
                         AND t.Status <> 'Completed'
                        THEN 'Overdue'

                    WHEN t.Status IN ('Blocked', 'Not Started')
                        THEN 'On Hold'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END AS Status,

                COUNT(*) AS Count

            FROM ProjectTasks t

            GROUP BY
                CASE
                    WHEN t.Status = 'Completed'
                        THEN 'Completed'

                    WHEN t.DueDate IS NOT NULL
                         AND t.DueDate < CAST(GETDATE() AS DATE)
                         AND t.Status <> 'Completed'
                        THEN 'Overdue'

                    WHEN t.Status IN ('Blocked', 'Not Started')
                        THEN 'On Hold'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END

            ORDER BY Count DESC
        `;
    }



    // DEPARTMENT MANAGER
    else if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        result = await sql.query`

            SELECT
                CASE
                    WHEN t.Status = 'Completed'
                        THEN 'Completed'

                    WHEN t.DueDate IS NOT NULL
                         AND t.DueDate < CAST(GETDATE() AS DATE)
                         AND t.Status <> 'Completed'
                        THEN 'Overdue'

                    WHEN t.Status IN ('Blocked', 'Not Started')
                        THEN 'On Hold'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END AS Status,

                COUNT(DISTINCT t.TaskID) AS Count

            FROM ProjectTasks t

            INNER JOIN ProjectDepartments pd
                ON t.ProjectID = pd.ProjectID

            WHERE pd.DepartmentID = ${user.DepartmentID}

            GROUP BY
                CASE
                    WHEN t.Status = 'Completed'
                        THEN 'Completed'

                    WHEN t.DueDate IS NOT NULL
                         AND t.DueDate < CAST(GETDATE() AS DATE)
                         AND t.Status <> 'Completed'
                        THEN 'Overdue'

                    WHEN t.Status IN ('Blocked', 'Not Started')
                        THEN 'On Hold'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END

            ORDER BY Count DESC
        `;
    }



    // PROJECT MANAGER
    else if (user.RoleName === Roles.PROJECT_MANAGER) {

        result = await sql.query`

            SELECT
                CASE
                    WHEN t.Status = 'Completed'
                        THEN 'Completed'

                    WHEN t.DueDate IS NOT NULL
                         AND t.DueDate < CAST(GETDATE() AS DATE)
                         AND t.Status <> 'Completed'
                        THEN 'Overdue'

                    WHEN t.Status IN ('Blocked', 'Not Started')
                        THEN 'On Hold'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END AS Status,

                COUNT(*) AS Count

            FROM ProjectTasks t

            INNER JOIN Projects p
                ON t.ProjectID = p.ProjectID

            WHERE p.ProjectManagerID = ${user.UserID}

            GROUP BY
                CASE
                    WHEN t.Status = 'Completed'
                        THEN 'Completed'

                    WHEN t.DueDate IS NOT NULL
                         AND t.DueDate < CAST(GETDATE() AS DATE)
                         AND t.Status <> 'Completed'
                        THEN 'Overdue'

                    WHEN t.Status IN ('Blocked', 'Not Started')
                        THEN 'On Hold'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END

            ORDER BY Count DESC
        `;
    }



    // EMPLOYEE / OTHER
    else {

        result = await sql.query`

            SELECT
                CASE
                    WHEN t.Status = 'Completed'
                        THEN 'Completed'

                    WHEN t.DueDate IS NOT NULL
                         AND t.DueDate < CAST(GETDATE() AS DATE)
                         AND t.Status <> 'Completed'
                        THEN 'Overdue'

                    WHEN t.Status IN ('Blocked', 'Not Started')
                        THEN 'On Hold'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END AS Status,

                COUNT(*) AS Count

            FROM ProjectTasks t

            WHERE t.AssignedTo = ${user.UserID}

            GROUP BY
                CASE
                    WHEN t.Status = 'Completed'
                        THEN 'Completed'

                    WHEN t.DueDate IS NOT NULL
                         AND t.DueDate < CAST(GETDATE() AS DATE)
                         AND t.Status <> 'Completed'
                        THEN 'Overdue'

                    WHEN t.Status IN ('Blocked', 'Not Started')
                        THEN 'On Hold'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END

            ORDER BY Count DESC
        `;
    }



    return result.recordset;
};

const getUpcomingDeadlines = async (user) => {

    let result;



    // ADMIN + PMO MANAGER
    if (
        user.RoleName === Roles.ADMIN ||
        user.RoleName === Roles.PMO_MANAGER
    ) {

        result = await sql.query`

            SELECT TOP 10
                t.TaskID,
                t.TaskTitle,
                t.Status,
                t.PriorityLevel,
                t.DueDate,
                p.ProjectID,
                p.ProjectName

            FROM ProjectTasks t

            INNER JOIN Projects p
                ON t.ProjectID = p.ProjectID

            WHERE
                t.DueDate IS NOT NULL
                AND t.Status NOT IN ('Completed')
                AND t.DueDate >= CAST(GETDATE() AS DATE)

            ORDER BY t.DueDate ASC
        `;
    }



    // DEPARTMENT MANAGER
    else if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        result = await sql.query`

            SELECT DISTINCT TOP 10
                t.TaskID,
                t.TaskTitle,
                t.Status,
                t.PriorityLevel,
                t.DueDate,
                p.ProjectID,
                p.ProjectName

            FROM ProjectTasks t

            INNER JOIN Projects p
                ON t.ProjectID = p.ProjectID

            INNER JOIN ProjectDepartments pd
                ON p.ProjectID = pd.ProjectID

            WHERE
                pd.DepartmentID = ${user.DepartmentID}
                AND t.DueDate IS NOT NULL
                AND t.Status NOT IN ('Completed')
                AND t.DueDate >= CAST(GETDATE() AS DATE)

            ORDER BY t.DueDate ASC
        `;
    }



    // PROJECT MANAGER
    else if (user.RoleName === Roles.PROJECT_MANAGER) {

        result = await sql.query`

            SELECT TOP 10
                t.TaskID,a
                t.TaskTitle,
                t.Status,
                t.PriorityLevel,
                t.DueDate,
                p.ProjectID,
                p.ProjectName

            FROM ProjectTasks t

            INNER JOIN Projects p
                ON t.ProjectID = p.ProjectID

            WHERE
                p.ProjectManagerID = ${user.UserID}
                AND t.DueDate IS NOT NULL
                AND t.Status NOT IN ('Completed')
                AND t.DueDate >= CAST(GETDATE() AS DATE)

            ORDER BY t.DueDate ASC
        `;
    }



    // EMPLOYEE / OTHER
    else {

        result = await sql.query`

            SELECT TOP 10
                t.TaskID,
                t.TaskTitle,
                t.Status,
                t.PriorityLevel,
                t.DueDate,
                p.ProjectID,
                p.ProjectName

            FROM ProjectTasks t

            INNER JOIN Projects p
                ON t.ProjectID = p.ProjectID

            WHERE
                t.AssignedTo = ${user.UserID}
                AND t.DueDate IS NOT NULL
                AND t.Status NOT IN ('Completed')
                AND t.DueDate >= CAST(GETDATE() AS DATE)

            ORDER BY t.DueDate ASC
        `;
    }



    return result.recordset;
};

const getTaskPriority = async (user) => {

    let result;



    // ADMIN + PMO MANAGER
    if (
        user.RoleName === Roles.ADMIN ||
        user.RoleName === Roles.PMO_MANAGER
    ) {

        result = await sql.query`

            SELECT
                PriorityLevel,
                COUNT(*) AS Count

            FROM ProjectTasks

            GROUP BY PriorityLevel

            ORDER BY Count DESC
        `;
    }



    // DEPARTMENT MANAGER
    else if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        result = await sql.query`

            SELECT
                t.PriorityLevel,
                COUNT(DISTINCT t.TaskID) AS Count

            FROM ProjectTasks t

            INNER JOIN ProjectDepartments pd
                ON t.ProjectID = pd.ProjectID

            WHERE pd.DepartmentID = ${user.DepartmentID}

            GROUP BY t.PriorityLevel

            ORDER BY Count DESC
        `;
    }



    // PROJECT MANAGER
    else if (user.RoleName === Roles.PROJECT_MANAGER) {

        result = await sql.query`

            SELECT
                t.PriorityLevel,
                COUNT(*) AS Count

            FROM ProjectTasks t

            INNER JOIN Projects p
                ON t.ProjectID = p.ProjectID

            WHERE p.ProjectManagerID = ${user.UserID}

            GROUP BY t.PriorityLevel

            ORDER BY Count DESC
        `;
    }



    // EMPLOYEE / OTHER
    else {

        result = await sql.query`

            SELECT
                PriorityLevel,
                COUNT(*) AS Count

            FROM ProjectTasks

            WHERE AssignedTo = ${user.UserID}

            GROUP BY PriorityLevel

            ORDER BY Count DESC
        `;
    }



    return result.recordset;
};

module.exports = {

    dashboard,
    getProgress,
    getTaskStatus,
    getUpcomingDeadlines,
    getTaskPriority

};