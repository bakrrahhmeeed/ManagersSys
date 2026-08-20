const sql = require("mssql");

const addcomment = async (user, data) => {
    const {
        referenceType,
        referenceId,
        commentText
    } = data;

    const normalizedType = String(
        referenceType || ""
    )
        .trim()
        .toLowerCase();

    if (!referenceId) {
        throw new Error("Reference ID is required");
    }

    if (!commentText || !String(commentText).trim()) {
        throw new Error("Comment text is required");
    }

    if (
        !["project", "stage", "task"].includes(
            normalizedType
        )
    ) {
        throw new Error(
            "Reference type must be Project, Stage, or Task"
        );
    }

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

    employee: "employee",

    "project manager": "project manager",
    projectmanager: "project manager",

    "department manager": "department manager",
    departmentmanager: "department manager",
};

const role = roleMap[rawRole] || rawRole;

    if (!userId) {
        throw new Error("User not found");
    }

    const pool = await sql.connect();

    let allowed = false;

    if (role === "employee") {
        if (normalizedType !== "task") {
            throw new Error(
                "Employees can only comment on tasks"
            );
        }

        const result = await pool.request()
            .input(
                "referenceId",
                sql.Int,
                referenceId
            )
            .input(
                "userId",
                sql.Int,
                userId
            )
            .query(`
                SELECT TOP 1
                    TaskID
                FROM ProjectTasks
                WHERE
                    TaskID = @referenceId
                    AND AssignedTo = @userId
            `);

        allowed =
            result.recordset.length > 0;
    }

    else if (role === "project manager") {
        if (
            normalizedType !== "project" &&
            normalizedType !== "stage"
        ) {
            throw new Error(
                "Project Managers can only comment on projects and stages"
            );
        }

        if (normalizedType === "project") {
            const result = await pool.request()
                .input(
                    "referenceId",
                    sql.Int,
                    referenceId
                )
                .input(
                    "userId",
                    sql.Int,
                    userId
                )
                .query(`
                    SELECT TOP 1
                        ProjectID
                    FROM Projects
                    WHERE
                        ProjectID = @referenceId
                        AND ProjectManagerID = @userId
                `);

            allowed =
                result.recordset.length > 0;
        }

        if (normalizedType === "stage") {
            const result = await pool.request()
                .input(
                    "referenceId",
                    sql.Int,
                    referenceId
                )
                .input(
                    "userId",
                    sql.Int,
                    userId
                )
                .query(`
                    SELECT TOP 1
                        PS.StageID
                    FROM ProjectStages PS
                    INNER JOIN Projects P
                        ON P.ProjectID = PS.ProjectID
                    WHERE
                        PS.StageID = @referenceId
                        AND P.ProjectManagerID = @userId
                `);

            allowed =
                result.recordset.length > 0;
        }
    }

    else if (role === "department manager") {
        if (
            normalizedType !== "stage" &&
            normalizedType !== "task"
        ) {
            throw new Error(
                "Department Managers can only comment on stages and tasks"
            );
        }

        const departmentResult =
            await pool.request()
                .input(
                    "userId",
                    sql.Int,
                    userId
                )
                .query(`
                    SELECT TOP 1
                        DepartmentID
                    FROM Users
                    WHERE
                        UserID = @userId
                `);

        if (
            !departmentResult.recordset.length
        ) {
            throw new Error(
                "User department not found"
            );
        }

        const departmentId =
            departmentResult.recordset[0]
                .DepartmentID;

        if (normalizedType === "stage") {
            const result =
                await pool.request()
                    .input(
                        "referenceId",
                        sql.Int,
                        referenceId
                    )
                    .input(
                        "departmentId",
                        sql.Int,
                        departmentId
                    )
                    .query(`
                        SELECT TOP 1
                            StageID
                        FROM ProjectStages
                        WHERE
                            StageID = @referenceId
                            AND DepartmentID = @departmentId
                    `);

            allowed =
                result.recordset.length > 0;
        }

        if (normalizedType === "task") {
            const result =
                await pool.request()
                    .input(
                        "referenceId",
                        sql.Int,
                        referenceId
                    )
                    .input(
                        "departmentId",
                        sql.Int,
                        departmentId
                    )
                    .query(`
                        SELECT TOP 1
                            PT.TaskID
                        FROM ProjectTasks PT
                        INNER JOIN Users U
                            ON U.UserID = PT.AssignedTo
                        WHERE
                            PT.TaskID = @referenceId
                            AND U.DepartmentID = @departmentId
                    `);

            allowed =
                result.recordset.length > 0;
        }
    }

    else if (role === "admin") {
        allowed = true;
    }

    if (!allowed) {
        throw new Error(
            "You are not allowed to comment on this resource"
        );
    }

    const result = await pool.request()
        .input(
            "referenceType",
            sql.NVarChar(100),
            referenceType
        )
        .input(
            "referenceId",
            sql.Int,
            referenceId
        )
        .input(
            "commentText",
            sql.NVarChar(sql.MAX),
            String(commentText).trim()
        )
        .input(
            "createdBy",
            sql.Int,
            userId
        )
        .query(`
            INSERT INTO Comments
            (
                ReferenceType,
                ReferenceID,
                CommentText,
                CreatedBy,
                CreatedAt
            )
            OUTPUT
                INSERTED.CommentID,
                INSERTED.ReferenceType,
                INSERTED.ReferenceID,
                INSERTED.CommentText,
                INSERTED.CreatedBy,
                INSERTED.CreatedAt
            VALUES
            (
                @referenceType,
                @referenceId,
                @commentText,
                @createdBy,
                GETDATE()
            )
        `);

    return result.recordset[0];
};

const addcommentonProject = async (user, data) => {

    const {
        referenceId,
        commentText
    } = data;


    if (!referenceId) {
        throw new Error("Project ID is required");
    }

    if (!commentText || !String(commentText).trim()) {
        throw new Error("Comment text is required");
    }

    const userId =
        user?.UserID ||
        user?.userId ||
        user?.id;


    if (!userId) {
        throw new Error("User not found");
    }


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

    };


    const role =
        roleMap[rawRole] || rawRole;


    if (
        role !== "admin" &&
        role !== "pmo manager" &&
        role !== "project manager"
    ) {

        throw new Error(
            "You are not allowed to comment on projects"
        );

    }


    const pool = await sql.connect();


    const projectResult =
        await pool.request()

            .input(
                "projectId",
                sql.Int,
                referenceId
            )

            .query(`
                SELECT TOP 1
                    ProjectID,
                    ProjectManagerID
                FROM Projects
                WHERE
                    ProjectID = @projectId
            `);


    if (
        !projectResult.recordset.length
    ) {

        throw new Error(
            "Project not found"
        );

    }


    const project =
        projectResult.recordset[0];


    if (
        role === "project manager" &&
        project.ProjectManagerID !== userId
    ) {

        throw new Error(
            "Project Managers can only comment on projects they manage"
        );

    }


    const result =
        await pool.request()

            .input(
                "referenceType",
                sql.NVarChar(100),
                "Project"
            )

            .input(
                "referenceId",
                sql.Int,
                referenceId
            )

            .input(
                "commentText",
                sql.NVarChar(sql.MAX),
                String(commentText).trim()
            )

            .input(
                "createdBy",
                sql.Int,
                userId
            )

            .query(`
                INSERT INTO Comments
                (
                    ReferenceType,
                    ReferenceID,
                    CommentText,
                    CreatedBy,
                    CreatedAt
                )

                OUTPUT
                    INSERTED.CommentID,
                    INSERTED.ReferenceType,
                    INSERTED.ReferenceID,
                    INSERTED.CommentText,
                    INSERTED.CreatedBy,
                    INSERTED.CreatedAt

                VALUES
                (
                    @referenceType,
                    @referenceId,
                    @commentText,
                    @createdBy,
                    GETDATE()
                )
            `);


    return result.recordset[0];
};

module.exports = {
    addcomment,
    addcommentonProject
};