const sql = require('mssql');
const Roles = require("../constants/roles")
const {
    getStageProgress,
    getProjectProgress
} = require("../middleware/calculateProgress");



const getAllStages = async () => {
    const result = await sql.query`select * from ProjectStages`;
    return result.recordset;
};

const createStage = async (user, data) => {
    const {
        projectId,
        stageName,
        stageOrder,
        targetEndDate,
        responsibleUserId,
        notes,
        departmentId
    } = data;

    const userId =
        user?.UserID ||
        user?.userId ||
        user?.id;

    const rawRole = String(
        user?.RoleName ||
        user?.roleName ||
        user?.Role ||
        user?.role ||
        ""
    )
        .trim()
        .toLowerCase();

    const roleMap = {
        administrator: "admin",
        admin: "admin",

        "pmo manager": "pmo manager",
        pmomanager: "pmo manager",

        "project manager": "project manager",
        projectmanager: "project manager",

        "department manager": "department manager",
        departmentmanager: "department manager",

        secretary: "secretary",
        employee: "employee"
    };

    const role = roleMap[rawRole] || rawRole;

    if (!userId) {
        throw new Error("User not found");
    }

    if (!projectId) {
        throw new Error("Project ID is required");
    }

    if (!stageName || !String(stageName).trim()) {
        throw new Error("Stage name is required");
    }

    if (
        stageOrder === undefined ||
        stageOrder === null ||
        !Number.isInteger(Number(stageOrder)) ||
        Number(stageOrder) <= 0
    ) {
        throw new Error("Stage order must be a positive integer");
    }

    if (!targetEndDate) {
        throw new Error("Target end date is required");
    }

    const parsedTargetEndDate = new Date(targetEndDate);

    if (Number.isNaN(parsedTargetEndDate.getTime())) {
        throw new Error("Invalid target end date");
    }

    if (!responsibleUserId) {
        throw new Error("Responsible user is required");
    }

    if (!departmentId) {
        throw new Error("Department is required");
    }

    if (
        !["admin", "pmo manager", "project manager"].includes(role)
    ) {
        const error = new Error(
            "You are not allowed to create stages"
        );

        error.statusCode = 403;

        throw error;
    }

    const pool = await sql.connect();

    const projectResult = await pool.request()
        .input(
            "projectId",
            sql.Int,
            projectId
        )
        .query(`
            SELECT
                ProjectID,
                ProjectManagerID,
                StartDate,
                TargetEndDate,
                Status
            FROM Projects
            WHERE ProjectID = @projectId
        `);

    if (!projectResult.recordset.length) {
        const error = new Error("Project not found");
        error.statusCode = 404;
        throw error;
    }

    const project = projectResult.recordset[0];

    if (
        role === "project manager" &&
        project.ProjectManagerID !== Number(userId)
    ) {
        const error = new Error(
            "You are not the project manager of this project"
        );

        error.statusCode = 403;

        throw error;
    }

    if (
        project.TargetEndDate &&
        parsedTargetEndDate > new Date(project.TargetEndDate)
    ) {
        throw new Error(
            "Stage target end date cannot be after the project target end date"
        );
    }

    if (
        project.StartDate &&
        parsedTargetEndDate < new Date(project.StartDate)
    ) {
        throw new Error(
            "Stage target end date cannot be before the project start date"
        );
    }

    const existingStageOrder = await pool.request()
        .input(
            "projectId",
            sql.Int,
            projectId
        )
        .input(
            "stageOrder",
            sql.Int,
            Number(stageOrder)
        )
        .query(`
            SELECT TOP 1
                StageID
            FROM ProjectStages
            WHERE
                ProjectID = @projectId
                AND StageOrder = @stageOrder
        `);

    if (existingStageOrder.recordset.length) {
        throw new Error(
            "A stage with the same order already exists for this project"
        );
    }

    const existingStageName = await pool.request()
        .input(
            "projectId",
            sql.Int,
            projectId
        )
        .input(
            "stageName",
            sql.NVarChar(255),
            String(stageName).trim()
        )
        .query(`
            SELECT TOP 1
                StageID
            FROM ProjectStages
            WHERE
                ProjectID = @projectId
                AND LOWER(LTRIM(RTRIM(StageName))) =
                    LOWER(LTRIM(RTRIM(@stageName)))
        `);

    if (existingStageName.recordset.length) {
        throw new Error(
            "A stage with the same name already exists for this project"
        );
    }

    const departmentResult = await pool.request()
        .input(
            "departmentId",
            sql.Int,
            departmentId
        )
        .query(`
            SELECT TOP 1
                DepartmentID
            FROM Departments
            WHERE DepartmentID = @departmentId
        `);

    if (!departmentResult.recordset.length) {
        const error = new Error("Department not found");
        error.statusCode = 404;
        throw error;
    }

    const responsibleUserResult = await pool.request()
        .input(
            "responsibleUserId",
            sql.Int,
            responsibleUserId
        )
        .query(`
            SELECT TOP 1
                UserID,
                DepartmentID
            FROM Users
            WHERE UserID = @responsibleUserId
        `);

    if (!responsibleUserResult.recordset.length) {
        const error = new Error(
            "Responsible user not found"
        );

        error.statusCode = 404;

        throw error;
    }

    const responsibleUser =
        responsibleUserResult.recordset[0];

    if (
        responsibleUser.DepartmentID !==
        Number(departmentId)
    ) {
        throw new Error(
            "Responsible user must belong to the selected department"
        );
    }

    const result = await pool.request()
        .input(
            "projectId",
            sql.Int,
            projectId
        )
        .input(
            "stageName",
            sql.NVarChar(255),
            String(stageName).trim()
        )
        .input(
            "stageOrder",
            sql.Int,
            Number(stageOrder)
        )
        .input(
            "targetEndDate",
            sql.DateTime,
            parsedTargetEndDate
        )
        .input(
            "responsibleUserId",
            sql.Int,
            responsibleUserId
        )
        .input(
            "notes",
            sql.NVarChar(sql.MAX),
            notes ? String(notes).trim() : null
        )
        .input(
            "departmentId",
            sql.Int,
            departmentId
        )
        .query(`
            INSERT INTO ProjectStages
            (
                ProjectID,
                StageName,
                StageOrder,
                Status,
                StartDate,
                EndDate,
                ActualEndDate,
                ResponsibleUserID,
                Notes,
                DepartmentID
            )
            OUTPUT
                INSERTED.StageID,
                INSERTED.ProjectID,
                INSERTED.StageName,
                INSERTED.StageOrder,
                INSERTED.Status,
                INSERTED.StartDate,
                INSERTED.EndDate,
                INSERTED.ActualEndDate,
                INSERTED.ResponsibleUserID,
                INSERTED.Notes,
                INSERTED.DepartmentID
            VALUES
            (
                @projectId,
                @stageName,
                @stageOrder,
                'Not Started',
                GETDATE(),
                @targetEndDate,
                NULL,
                @responsibleUserId,
                @notes,
                @departmentId
            )
        `);

    return {
        message: "Stage created successfully",
        stage: result.recordset[0]
    };
};

const updateStage = async (id, data) => {

    const {
        stageName,
        stageOrder,
        status,
        endDate,
        responsibleUserId,
        notes
    } = data;


    const existingStage = await sql.query`
        SELECT *
        FROM ProjectStages
        WHERE StageID = ${id}
    `;


    if (existingStage.recordset.length === 0) {

        const error = new Error("Stage not found.");
        error.statusCode = 404;
        throw error;
    }


    const currentStage = existingStage.recordset[0];


    if (currentStage.Status === "Completed") {

        const error = new Error(
            "Completed stages cannot be modified."
        );

        error.statusCode = 403;
        throw error;
    }


    const finalStatus =
        status ?? currentStage.Status;


    const allowedStatuses = [
        "Not Started",
        "In Progress",
        "Blocked",
        "Completed"
    ];


    if (!allowedStatuses.includes(finalStatus)) {

        const error = new Error(
            "Invalid stage status."
        );

        error.statusCode = 400;
        throw error;
    }


    let finalActualEndDate = null;


    if (finalStatus === "Completed") {
        finalActualEndDate = new Date();
    }


    const result = await sql.query`
        UPDATE ProjectStages
        SET
            StageName =
                COALESCE(${stageName}, StageName),

            StageOrder =
                COALESCE(${stageOrder}, StageOrder),

            Status =
                COALESCE(${status}, Status),

            EndDate =
                COALESCE(${endDate}, EndDate),

            ActualEndDate =
                ${finalActualEndDate},

            ResponsibleUserID =
                COALESCE(
                    ${responsibleUserId},
                    ResponsibleUserID
                ),

            Notes =
                COALESCE(${notes}, Notes)

        OUTPUT
            INSERTED.StageID,
            INSERTED.ProjectID,
            INSERTED.StageName,
            INSERTED.StageOrder,
            INSERTED.Status,
            INSERTED.StartDate,
            INSERTED.EndDate,
            INSERTED.ActualEndDate,
            INSERTED.ResponsibleUserID,
            INSERTED.Notes,
            INSERTED.DepartmentID

        WHERE StageID = ${id};
    `;


    return {
        message: "Stage updated successfully",
        stage: result.recordset[0]
    };
};

const deleteStage = async (id) => {
    const existingStage = await sql.query`
        SELECT *
        FROM ProjectStages
        WHERE StageID = ${id}
    `;

    if (existingStage.recordset.length === 0) {
        const error = new Error("Stage not found.");
        error.statusCode = 404;
        throw error;
    }

    const tasks = await sql.query`
    SELECT TOP 1 TaskID
    FROM Tasks
    WHERE StageID = ${id}
`;

if (tasks.recordset.length > 0) {
    const error = new Error("Cannot delete stage because it contains tasks.");
    error.statusCode = 400;
    throw error;
}

    await sql.query`
        DELETE FROM ProjectStages
        WHERE StageID = ${id}
    `;

    return {
        message: "Stage deleted successfully"
    };      
}

// const getStage = async (id) => {


//     const result = await sql.query`
//         SELECT
//             s.*,
//             p.ProjectName,
//             u.FullName AS ResponsibleUser,
//             d.DepartmentName
//         FROM ProjectStages s
//         JOIN Projects p
//             ON s.ProjectID = p.ProjectID
//         LEFT JOIN Users u
//             ON s.ResponsibleUserID = u.UserID
//         LEFT JOIN Departments d
//             ON s.DepartmentID = d.DepartmentID
//         WHERE s.StageID = ${id}
//     `;

//     if (result.recordset.length === 0) {
//         const error = new Error("Stage not found.");
//         error.statusCode = 404;
//         throw error;
//     }

//     return result.recordset[0];
// };



const getStage = async (id, user) => {

    const result = await sql.query`
        SELECT
            s.*,
            p.ProjectName,
            p.ProjectManagerID,
            u.FullName AS ResponsibleUser,
            d.DepartmentName
        FROM ProjectStages s

        JOIN Projects p
            ON s.ProjectID = p.ProjectID

        LEFT JOIN Users u
            ON s.ResponsibleUserID = u.UserID

        LEFT JOIN Departments d
            ON s.DepartmentID = d.DepartmentID

        WHERE s.StageID = ${id}
    `;


    if (result.recordset.length === 0) {

        const error = new Error("Stage not found.");
        error.statusCode = 404;
        throw error;

    }


    const stage = result.recordset[0];


    if (user.RoleName === Roles.PROJECT_MANAGER) {

        if (
            Number(stage.ProjectManagerID) !==
            Number(user.UserID)
        ) {

            const error = new Error(
                "You can only access stages from projects you manage."
            );

            error.statusCode = 403;
            throw error;

        }

    }


    return stage;
};

const getStagesByProject = async (projectId) => {

    const result = await sql.query`
        SELECT
            p.ProjectID,
            p.ProjectName,
            p.ProjectManagerID,
            pm.FullName AS ProjectManager,
            p.StartDate AS ProjectStartDate,
            p.TargetEndDate AS ProjectEndDate,
            p.Status AS ProjectStatus,

            s.StageID,
            s.StageName,
            s.StageOrder,
            s.Status AS StageStatus,
            s.StartDate AS StageStartDate,
            s.EndDate AS StageEndDate,
            s.ActualEndDate AS StageActualEndDate,
            s.ResponsibleUserID,
            ru.FullName AS ResponsibleUser,
            s.DepartmentID,
            d.DepartmentName

        FROM Projects p

        LEFT JOIN Users pm
            ON p.ProjectManagerID = pm.UserID

        LEFT JOIN ProjectStages s
            ON p.ProjectID = s.ProjectID

        LEFT JOIN Users ru
            ON s.ResponsibleUserID = ru.UserID

        LEFT JOIN Departments d
            ON s.DepartmentID = d.DepartmentID

        WHERE p.ProjectID = ${projectId}

        ORDER BY s.StageOrder
    `;

    if (!result.recordset.length) {
        throw new Error("Project not found");
    }

    const rows = result.recordset;

    const project = {
        ProjectID: rows[0].ProjectID,
        ProjectName: rows[0].ProjectName,
        ProjectManagerID: rows[0].ProjectManagerID,
        ProjectManager: rows[0].ProjectManager,
        StartDate: rows[0].ProjectStartDate,
        EndDate: rows[0].ProjectEndDate,
        Status: rows[0].ProjectStatus,
        ProgressPercent: await getProjectProgress(projectId),
        Stages: []
    };

    for (const row of rows) {

        if (!row.StageID) {
            continue;
        }

        project.Stages.push({
            StageID: row.StageID,
            StageName: row.StageName,
            StageOrder: row.StageOrder,
            Status: row.StageStatus,
            ProgressPercent: await getStageProgress(row.StageID),
            StartDate: row.StageStartDate,
            EndDate: row.StageEndDate,
            ActualEndDate: row.StageActualEndDate,
            ResponsibleUserID: row.ResponsibleUserID,
            ResponsibleUser: row.ResponsibleUser,
            DepartmentID: row.DepartmentID,
            DepartmentName: row.DepartmentName
        });
    }

    return project;
};

const getProjectsWithStages = async (user) => {

    const userId =
        user?.UserID ||
        user?.userId ||
        user?.id;

    const rawRole = String(
        user?.RoleName ||
        user?.roleName ||
        user?.Role ||
        user?.role ||
        ""
    )
        .trim()
        .toLowerCase();

    const roleMap = {
        administrator: "admin",
        admin: "admin",

        "pmo manager": "pmo manager",
        pmomanager: "pmo manager",

        "project manager": "project manager",
        projectmanager: "project manager",

        "department manager": "department manager",
        departmentmanager: "department manager",

        secretary: "secretary",

        employee: "employee"
    };

    const role = roleMap[rawRole] || rawRole;

    if (!userId) {
        throw new Error("User not found");
    }

    const pool = await sql.connect();

    let departmentId = null;

    if (role === "department manager") {

        const departmentResult =
            await pool.request()
                .input(
                    "userId",
                    sql.Int,
                    userId
                )
                .query(`
                    SELECT DepartmentID
                    FROM Users
                    WHERE UserID = @userId
                `);

        if (!departmentResult.recordset.length) {
            throw new Error("User not found");
        }

        departmentId =
            departmentResult.recordset[0].DepartmentID;

        if (!departmentId) {
            throw new Error("User department not found");
        }
    }

    const result = await pool.request()
        .input(
            "userId",
            sql.Int,
            userId
        )
        .input(
            "departmentId",
            sql.Int,
            departmentId
        )
        .input(
            "role",
            sql.NVarChar(100),
            role
        )
        .query(`
            SELECT
                p.ProjectID,
                p.ProjectName,
                p.ProjectManagerID,
                pm.FullName AS ProjectManager,

                p.StartDate AS ProjectStartDate,
                p.TargetEndDate AS ProjectTargetEndDate,
                p.ActualEndDate AS ProjectActualEndDate,
                p.Status AS ProjectStatus,

                s.StageID,
                s.StageName,
                s.StageOrder,
                s.Status AS StageStatus,

                s.StartDate AS StageStartDate,
                s.EndDate AS StageEndDate,
                s.ActualEndDate AS StageActualEndDate,

                s.ResponsibleUserID,
                ru.FullName AS ResponsibleUser,

                s.DepartmentID,
                d.DepartmentName

FROM Projects p

LEFT JOIN Users pm
    ON p.ProjectManagerID = pm.UserID

LEFT JOIN ProjectStages s
    ON p.ProjectID = s.ProjectID
    AND (
        @role <> 'department manager'
        OR s.DepartmentID = @departmentId
    )

LEFT JOIN Users ru
    ON s.ResponsibleUserID = ru.UserID

LEFT JOIN Departments d
    ON s.DepartmentID = d.DepartmentID

            WHERE
                (
                    @role IN (
                        'admin',
                        'pmo manager',
                        'secretary'
                    )
                )

                OR

                (
                    @role = 'project manager'
                    AND p.ProjectManagerID = @userId
                )

                OR

                (
                    @role = 'department manager'
                    AND EXISTS (
                        SELECT 1
                        FROM ProjectStages DS
                        WHERE
                            DS.ProjectID = p.ProjectID
                            AND DS.DepartmentID = @departmentId
                    )
                )

                OR

                (
                    @role = 'employee'
                    AND EXISTS (
                        SELECT 1
                        FROM ProjectTasks PT
                        WHERE
                            PT.ProjectID = p.ProjectID
                            AND PT.AssignedTo = @userId
                    )
                )

            ORDER BY
             p.ProjectID DESC,
                s.StageOrder ASC
        `);

    const projectsMap = new Map();

    for (const row of result.recordset) {

        if (!projectsMap.has(row.ProjectID)) {

            projectsMap.set(
                row.ProjectID,
                {
                    ProjectID:
                        row.ProjectID,

                    ProjectName:
                        row.ProjectName,

                    ProjectManagerID:
                        row.ProjectManagerID,

                    ProjectManager:
                        row.ProjectManager,

                    StartDate:
                        row.ProjectStartDate,

                    TargetEndDate:
                        row.ProjectTargetEndDate,

                    ActualEndDate:
                        row.ProjectActualEndDate,

                    Status:
                        row.ProjectStatus,

                    ProgressPercent:
                        await getProjectProgress(
                            row.ProjectID
                        ),

                    Stages: []
                }
            );
        }

        if (row.StageID) {

            const project =
                projectsMap.get(
                    row.ProjectID
                );

            project.Stages.push({

                StageID:
                    row.StageID,

                StageName:
                    row.StageName,

                StageOrder:
                    row.StageOrder,

                Status:
                    row.StageStatus,

                ProgressPercent:
                    await getStageProgress(
                        row.StageID
                    ),

                StartDate:
                    row.StageStartDate,

                EndDate:
                    row.StageEndDate,

                ActualEndDate:
                    row.StageActualEndDate,

                ResponsibleUserID:
                    row.ResponsibleUserID,

                ResponsibleUser:
                    row.ResponsibleUser,

                DepartmentID:
                    row.DepartmentID,

                DepartmentName:
                    row.DepartmentName
            });
        }
    }

    return Array.from(
        projectsMap.values()
    );
};

const getDepartmentManger = async (departmentId) => {

    const parsedDepartmentId = Number(departmentId);

    if (!Number.isInteger(parsedDepartmentId) || parsedDepartmentId <= 0) {
        const error = new Error("Invalid department ID");
        error.statusCode = 400;
        throw error;
    }

    const pool = await sql.connect();

    const result = await pool.request()
        .input(
            "departmentId",
            sql.Int,
            parsedDepartmentId
        )
        .query(`
SELECT
    U.UserID,
    U.FullName,
    U.DepartmentID
FROM Users U

INNER JOIN UserRoles UR
    ON U.UserID = UR.UserID

INNER JOIN Roles R
    ON UR.RoleID = R.RoleID

WHERE
    U.DepartmentID = @departmentId
    AND U.IsActive = 1
    AND R.RoleName = 'Department Manager';
        `);

    return result.recordset;
};


module.exports = {
  getAllStages,
  createStage,
  updateStage,
  deleteStage,
  getStage,
  getStagesByProject,
  getProjectsWithStages,
  getDepartmentManger
};