const sql = require("mssql");
const Roles = require("../constants/roles");



const dashboard = async (user) => {

    let stats = {};
    let latestProjects = [];
    let chartData = {};
    let activities = [];
    let notifications = [];


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


        const latestProjectsResult = await sql.query`

            SELECT TOP 5
                p.ProjectID,
                p.ProjectName,
                p.Status,
                u.FullName AS ProjectManager,
                p.TargetEndDate AS DueDate

            FROM Projects p

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            ORDER BY p.ProjectID DESC
        `;

        latestProjects = latestProjectsResult.recordset;
    }


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


        const latestProjectsResult = await sql.query`

            SELECT DISTINCT TOP 5
                p.ProjectID,
                p.ProjectName,
                p.Status,
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
                SELECT COUNT(DISTINCT u.UserID) AS Total

                FROM Users u

                INNER JOIN ProjectTasks t
                    ON u.UserID = t.AssignedTo

                INNER JOIN Projects p
                    ON t.ProjectID = p.ProjectID

                WHERE
                    p.ProjectManagerID = ${user.UserID}
                    AND u.IsActive = 1
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


        const latestProjectsResult = await sql.query`

            SELECT TOP 5
                p.ProjectID,
                p.ProjectName,
                p.Status,
                u.FullName AS ProjectManager,
                p.TargetEndDate AS DueDate

            FROM Projects p

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            WHERE p.ProjectManagerID = ${user.UserID}

            ORDER BY p.ProjectID DESC
        `;

        latestProjects = latestProjectsResult.recordset;
    }



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


        const latestProjectsResult = await sql.query`

            SELECT DISTINCT TOP 5
                p.ProjectID,
                p.ProjectName,
                p.Status,
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


    const progressData = await getProgress(user);


    latestProjects = latestProjects.map((project) => {

        const progressProject =
            progressData.projects.find(
                (item) =>
                    item.projectId === project.ProjectID
            );

        return {
            ...project,

            Progress:
                progressProject
                    ? progressProject.overallProgress
                    : 0
        };
    });



    chartData = {
        overallProgress:
            progressData.overallProgress
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
                p.TargetEndDate AS DueDate

            FROM Projects p

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            ORDER BY p.ProjectID DESC
        `;
    }


    else if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        result = await sql.query`

            SELECT DISTINCT

                p.ProjectID,
                p.ProjectName,
                p.Status,

                u.FullName AS Manager,
                p.TargetEndDate AS DueDate

            FROM Projects p

            INNER JOIN ProjectDepartments pd
                ON p.ProjectID = pd.ProjectID

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            WHERE pd.DepartmentID = ${user.DepartmentID}

            ORDER BY p.ProjectID DESC
        `;
    }

    else if (user.RoleName === Roles.PROJECT_MANAGER) {

        result = await sql.query`

            SELECT

                p.ProjectID,
                p.ProjectName,
                p.Status,

                u.FullName AS Manager,
                p.TargetEndDate AS DueDate

            FROM Projects p

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            WHERE p.ProjectManagerID = ${user.UserID}

            ORDER BY p.ProjectID DESC
        `;
    }

    else {

        result = await sql.query`

            SELECT DISTINCT

                p.ProjectID,
                p.ProjectName,
                p.Status,

                u.FullName AS Manager,
                p.TargetEndDate AS DueDate

            FROM Projects p

            INNER JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            LEFT JOIN Users u
                ON p.ProjectManagerID = u.UserID

            WHERE t.AssignedTo = ${user.UserID}

            ORDER BY p.ProjectID DESC
        `;
    }



    const projects = [];


    for (const project of result.recordset) {


        const stagesResult = await sql.query`

            SELECT
                StageID,
                StageName,
                StageOrder,
                Status

            FROM ProjectStages

            WHERE ProjectID = ${project.ProjectID}

            ORDER BY StageOrder ASC
        `;


        const stages = stagesResult.recordset;


        if (stages.length === 0) {

            projects.push({

                projectId: project.ProjectID,
                projectName: project.ProjectName,
                status: project.Status,

                manager: project.Manager || null,
                dueDate: project.DueDate || null,

                totalStages: 0,
                completedStages: 0,

                overallProgress: 0,

                stages: []
            });

            continue;
        }


        let totalStageProgress = 0;
        let completedStages = 0;

        const stageProgress = [];


        for (const stage of stages) {

            let progress = 0;



            if (stage.Status === "Completed") {

                progress = 100;

                completedStages++;
            }


            else if (stage.Status === "Not Started") {

                progress = 0;
            }


            else if (stage.Status === "Blocked") {

                progress = 0;
            }


            else if (stage.Status === "In Progress") {

                const tasksResult = await sql.query`

                    SELECT

                        COUNT(*) AS TotalTasks,

                        COUNT(
                            CASE
                                WHEN Status = 'Completed'
                                THEN 1
                            END
                        ) AS CompletedTasks

                    FROM ProjectTasks

                    WHERE StageID = ${stage.StageID}
                `;


                const totalTasks =
                    Number(
                        tasksResult.recordset[0].TotalTasks
                    );


                const completedTasks =
                    Number(
                        tasksResult.recordset[0].CompletedTasks
                    );


                progress =
                    totalTasks === 0
                        ? 0
                        : (
                            completedTasks /
                            totalTasks
                        ) * 100;
            }


            progress = Math.min(
                100,
                Math.max(
                    0,
                    progress
                )
            );


            // Add stage progress
            totalStageProgress += progress;


            stageProgress.push({

                stageId: stage.StageID,

                stageName: stage.StageName,

                stageOrder: stage.StageOrder,

                status: stage.Status,

                progress: Number(
                    progress.toFixed(2)
                )
            });
        }



        const overallProgress =
            totalStageProgress /
            stages.length;


        projects.push({

            projectId: project.ProjectID,

            projectName: project.ProjectName,

            status: project.Status,

            manager:
                project.Manager ||
                null,

            dueDate:
                project.DueDate ||
                null,

            totalStages:
                stages.length,

            completedStages,

            overallProgress:
                Number(
                    overallProgress.toFixed(2)
                ),

            stages:
                stageProgress
        });
    }


    const overallProgress =

        projects.length === 0

            ? 0

            : projects.reduce(
                (sum, project) =>
                    sum + project.overallProgress,
                0
            ) / projects.length;


    return {

        overallProgress:
            Number(
                overallProgress.toFixed(2)
            ),

        projects
    };
};

const getTaskStatus = async (user) => {

    let result;

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
                        THEN 'Blocked'

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
                        THEN 'Blocked'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END

            ORDER BY Count DESC
        `;
    }


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
                        THEN 'Blocked'

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
                        THEN 'Blocked'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END

            ORDER BY Count DESC
        `;
    }


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
                        THEN 'Blocked'

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
                        THEN 'Blocked'

                    WHEN t.Status = 'In Progress'
                        THEN 'In Progress'

                    ELSE t.Status
                END

            ORDER BY Count DESC
        `;
    }

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
                        THEN 'Blocked'

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
                        THEN 'Blocked'

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