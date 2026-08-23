const sql = require("mssql");

const projectdetails = async (id, user) => {

    const Roles = require("../constants/roles");

    if (
        user.RoleName !== Roles.ADMIN &&
        user.RoleName !== Roles.PMO_MANAGER &&
        user.RoleName !== Roles.SECRETARY
    ) {


        if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

            const access = await sql.query`
                SELECT TOP 1 1
                FROM ProjectDepartments
                WHERE
                    ProjectID = ${id}
                    AND DepartmentID = ${user.DepartmentID}
            `;

            if (access.recordset.length === 0) {

                const error = new Error("Access denied.");
                error.statusCode = 403;

                throw error;
            }
        }


        else if (user.RoleName === Roles.PROJECT_MANAGER) {

            const access = await sql.query`
                SELECT TOP 1 1
                FROM Projects
                WHERE
                    ProjectID = ${id}
                    AND ProjectManagerID = ${user.UserID}
            `;

            if (access.recordset.length === 0) {

                const error = new Error("Access denied.");
                error.statusCode = 403;

                throw error;
            }
        }



        else if (user.RoleName === Roles.EMPLOYEE) {

            const access = await sql.query`
                SELECT TOP 1 1
                FROM ProjectTasks
                WHERE
                    ProjectID = ${id}
                    AND AssignedTo = ${user.UserID}
            `;

            if (access.recordset.length === 0) {

                const error = new Error("Access denied.");
                error.statusCode = 403;

                throw error;
            }
        }


        else {

            const error = new Error("Access denied.");
            error.statusCode = 403;

            throw error;
        }
    }



const [
    project,
    projectDepartments,
    stages,
    tasks,
    updates,
    comments,
    issues,
    risks,
    objectives,
    keyResults
] = await Promise.all([



        sql.query`
            SELECT
                p.*,
                pm.FullName AS ProjectManagerName,
                cb.FullName AS CreatedByName
            FROM Projects p

            LEFT JOIN Users pm
                ON p.ProjectManagerID = pm.UserID

            LEFT JOIN Users cb
                ON p.CreatedBy = cb.UserID

            WHERE p.ProjectID = ${id}
        `,


        sql.query`
            SELECT
                pd.ProjectID,
                pd.DepartmentID,
                d.DepartmentName
            FROM ProjectDepartments pd

            INNER JOIN Departments d
                ON pd.DepartmentID = d.DepartmentID

            WHERE pd.ProjectID = ${id}

            ORDER BY pd.DepartmentID
        `,


        sql.query`
            SELECT
                ps.*,
                u.FullName AS ResponsibleUserName,
                d.DepartmentName
            FROM ProjectStages ps

            LEFT JOIN Users u
                ON ps.ResponsibleUserID = u.UserID

            LEFT JOIN Departments d
                ON ps.DepartmentID = d.DepartmentID

            WHERE ps.ProjectID = ${id}

            ORDER BY ps.StageOrder
        `,



        sql.query`
            SELECT
                pt.*,
                u.FullName AS AssignedToName,
                cb.FullName AS CreatedByName
            FROM ProjectTasks pt

            LEFT JOIN Users u
                ON pt.AssignedTo = u.UserID

            LEFT JOIN Users cb
                ON pt.CreatedBy = cb.UserID

            WHERE pt.ProjectID = ${id}
        `,



        sql.query`
            SELECT
                pu.*,
                u.FullName AS CreatedByName,
                ps.StageName
            FROM ProjectUpdates pu

            LEFT JOIN Users u
                ON pu.CreatedBy = u.UserID

            LEFT JOIN ProjectStages ps
                ON pu.StageID = ps.StageID

            WHERE pu.ProjectID = ${id}

            ORDER BY pu.CreatedAt DESC
        `,


        sql.query`
    SELECT
        c.*,
        u.FullName AS CreatedByName
    FROM Comments c
    LEFT JOIN Users u
        ON c.CreatedBy = u.UserID
    WHERE c.ReferenceID = ${id}
`
,
        sql.query`
            SELECT
                i.*,
                u.FullName AS AssignedToName
            FROM Issues i

            LEFT JOIN Users u
                ON i.AssignedTo = u.UserID

            WHERE i.ProjectID = ${id}
        `,



        sql.query`
            SELECT
                r.*,
                u.FullName AS OwnerName
            FROM Risks r

            LEFT JOIN Users u
                ON r.OwnerID = u.UserID

            WHERE r.ProjectID = ${id}
        `,



        sql.query`
            SELECT
                o.*,
                u.FullName AS OwnerName
            FROM Objectives o

            LEFT JOIN Users u
                ON o.OwnerID = u.UserID

            WHERE o.ProjectID = ${id}
        `,


        sql.query`
            SELECT
                kr.*,
                u.FullName AS ResponsibleUserName
            FROM KeyResults kr

            LEFT JOIN Users u
                ON kr.ResponsibleUserID = u.UserID

            INNER JOIN Objectives o
                ON kr.ObjectiveID = o.ObjectiveID

            WHERE o.ProjectID = ${id}
        `,

        sql.query`
    SELECT
        c.*,
        u.FullName AS CreatedByName
    FROM Comments c
    LEFT JOIN Users u
        ON c.CreatedBy = u.UserID
    WHERE c.ReferenceID = ${id}
`
    ]);




    if (project.recordset.length === 0) {

        const error = new Error("Project not found.");
        error.statusCode = 404;

        throw error;
    }



    stages.recordset.forEach(stage => {

        stage.tasks = tasks.recordset.filter(
            task =>
                task.StageID === stage.StageID
        );
    });



    objectives.recordset.forEach(objective => {

        objective.keyResults =
            keyResults.recordset.filter(
                keyResult =>
                    keyResult.ObjectiveID ===
                    objective.ObjectiveID
            );
    });




    let totalStageProgress = 0;

    let completedStages = 0;


    const calculatedStages =
        stages.recordset.map(stage => {

            let progress = 0;



            if (stage.Status === "Completed") {

                progress = 100;

                completedStages++;
            }



            else if (
                stage.Status === "Not Started"
            ) {

                progress = 0;
            }



            else if (
                stage.Status === "Blocked"
            ) {

                progress = 0;
            }



            else if (
                stage.Status === "In Progress"
            ) {

                const stageTasks =
                    tasks.recordset.filter(
                        task =>
                            task.StageID ===
                            stage.StageID
                    );


                const totalStageTasks =
                    stageTasks.length;


                const completedStageTasks =
                    stageTasks.filter(
                        task =>
                            task.Status ===
                            "Completed"
                    ).length;


                progress =
                    totalStageTasks === 0
                        ? 0
                        : (
                            completedStageTasks /
                            totalStageTasks
                        ) * 100;
            }



            progress = Math.min(
                100,
                Math.max(
                    0,
                    progress
                )
            );


            totalStageProgress += progress;


            return {
                ...stage,

                progress: Number(
                    progress.toFixed(2)
                )
            };
        });


    const totalStages =
        calculatedStages.length;


    const overallProgress =
        totalStages === 0
            ? 0
            : totalStageProgress /
              totalStages;


    const totalTasks =
        tasks.recordset.length;


    const completedTasks =
        tasks.recordset.filter(
            task =>
                task.Status === "Completed"
        ).length;



    const totalIssues =
        issues.recordset.length;


    const openIssues =
        issues.recordset.filter(
            issue =>
                issue.Status !== "Resolved" &&
                issue.Status !== "Closed"
        ).length;


    const totalRisks =
        risks.recordset.length;


    const highPriorityRisks =
        risks.recordset.filter(
            risk =>
                risk.Priority === "High" ||
                risk.PriorityLevel === "High"
        ).length;



    const totalObjectives =
        objectives.recordset.length;


    const totalKeyResults =
        keyResults.recordset.length;


    const projectData =
        project.recordset[0];



    const {
        ProgressPercent,
        ...projectWithoutOldProgress
    } = projectData;


    return {

        project: {

            ...projectWithoutOldProgress,


            projectDepartments:
                projectDepartments.recordset,


            totalStages,

            completedStages,

            totalTasks,

            completedTasks,

            totalIssues,

            openIssues,

            totalRisks,

            highPriorityRisks,

            totalObjectives,

            totalKeyResults,


            overallProgress:
                Number(
                    overallProgress.toFixed(2)
                )
        },


        stages:
            calculatedStages,

        updates:
            updates.recordset,

        comments:
            comments.recordset,

        issues:
            issues.recordset,

        risks:
            risks.recordset,

        objectives:
            objectives.recordset,


    };
};

module.exports = {
    projectdetails
};