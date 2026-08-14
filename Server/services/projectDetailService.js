const sql = require("mssql");

const projectdetails = async (id, user) => {
    const Roles = require("../constants/roles");

    if (
        user.RoleName !== Roles.ADMIN &&
        user.RoleName !== Roles.PMO_MANAGER
    ) {
        if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

            const access = await sql.query`
                SELECT TOP 1 1
                FROM ProjectDepartments
                WHERE ProjectID = ${id}
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
                WHERE ProjectID = ${id}
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
                WHERE ProjectID = ${id}
                AND AssignedToUserID = ${user.UserID}
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
        issues,
        risks,
        objectives,
        keyResults
    ] = await Promise.all([

        // Project
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

        // Project Departments
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

        // Stages
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

        // Tasks
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

        // Updates
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

        // Issues
        sql.query`
            SELECT
                i.*,
                u.FullName AS AssignedToName
            FROM Issues i

            LEFT JOIN Users u
                ON i.AssignedTo = u.UserID

            WHERE i.ProjectID = ${id}
        `,

        // Risks
        sql.query`
            SELECT
                r.*,
                u.FullName AS OwnerName
            FROM Risks r

            LEFT JOIN Users u
                ON r.OwnerID = u.UserID

            WHERE r.ProjectID = ${id}
        `,

        // Objectives
        sql.query`
            SELECT
                o.*,
                u.FullName AS OwnerName
            FROM Objectives o

            LEFT JOIN Users u
                ON o.OwnerID = u.UserID

            WHERE o.ProjectID = ${id}
        `,

        // Key Results
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
    ]);

    if (project.recordset.length === 0) {
        const error = new Error("Project not found.");
        error.statusCode = 404;
        throw error;
    }

    // Attach Tasks to Stages
    stages.recordset.forEach(stage => {
        stage.tasks = tasks.recordset.filter(
            task => task.StageID === stage.StageID
        );
    });

    // Attach Key Results to Objectives
    objectives.recordset.forEach(objective => {
        objective.keyResults = keyResults.recordset.filter(
            keyResult => keyResult.ObjectiveID === objective.ObjectiveID
        );
    });

    return {
        project: {
            ...project.recordset[0],

            // Departments connected to this project
            projectDepartments: projectDepartments.recordset
        },

        stages: stages.recordset,
        updates: updates.recordset,
        issues: issues.recordset,
        risks: risks.recordset,
        objectives: objectives.recordset
    };
};

module.exports = {
    projectdetails
};