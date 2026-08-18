const sql = require("mssql");
const Roles = require("../constants/roles");


const attachProgressToProjects = async (projects) => {

    if (!Array.isArray(projects) || projects.length === 0) {
        return [];
    }


    const projectIds = projects
        .map((project) => Number(project.ProjectID))
        .filter(Number.isInteger);


    if (projectIds.length === 0) {

        return projects.map((project) => ({
            ...project,
            overallProgress: 0
        }));

    }


    const request = new sql.Request();

    const placeholders = projectIds.map(
        (projectId, index) => {

            const parameterName = `projectId${index}`;

            request.input(
                parameterName,
                sql.Int,
                projectId
            );

            return `@${parameterName}`;
        }
    );



    const progressResult = await request.query(`

        SELECT
            ps.ProjectID,
            ps.StageID,
            ps.Status AS StageStatus,

            pt.TaskID,
            pt.Status AS TaskStatus

        FROM ProjectStages ps

        LEFT JOIN ProjectTasks pt
            ON pt.StageID = ps.StageID
            AND pt.ProjectID = ps.ProjectID

        WHERE ps.ProjectID IN (${placeholders.join(", ")})

        ORDER BY
            ps.ProjectID,
            ps.StageOrder

    `);



    const rowsByProject = new Map();


    for (const row of progressResult.recordset) {

        if (!rowsByProject.has(row.ProjectID)) {

            rowsByProject.set(
                row.ProjectID,
                new Map()
            );

        }


        const stages =
            rowsByProject.get(row.ProjectID);


        if (!stages.has(row.StageID)) {

            stages.set(
                row.StageID,
                {
                    stageStatus: row.StageStatus,
                    tasks: []
                }
            );

        }


        if (
            row.TaskID !== null &&
            row.TaskID !== undefined
        ) {

            stages
                .get(row.StageID)
                .tasks
                .push(row);

        }

    }



    return projects.map((project) => {

        const stages =
            rowsByProject.get(project.ProjectID);


        // Project has no stages
        if (!stages || stages.size === 0) {

            return {
                ...project,
                overallProgress: 0
            };

        }


        const stageProgresses = [];



        for (const stage of stages.values()) {

            const stageStatus =
                String(
                    stage.stageStatus || ""
                ).toLowerCase();



            if (stageStatus === "completed") {

                stageProgresses.push(100);

                continue;
            }


            if (
                stageStatus === "blocked" ||
                stageStatus === "on hold" ||
                stageStatus === "not started"
            ) {

                stageProgresses.push(0);

                continue;
            }



            if (stageStatus === "in progress") {

                const totalTasks =
                    stage.tasks.length;


                if (totalTasks === 0) {

                    stageProgresses.push(0);

                    continue;
                }


                const completedTasks =
                    stage.tasks.filter(
                        (task) =>
                            String(
                                task.TaskStatus || ""
                            ).toLowerCase() ===
                            "completed"
                    ).length;


                const stageProgress =
                    (
                        completedTasks /
                        totalTasks
                    ) * 100;


                stageProgresses.push(
                    stageProgress
                );


                continue;
            }


            const totalTasks =
                stage.tasks.length;


            if (totalTasks === 0) {

                stageProgresses.push(0);

                continue;
            }


            const completedTasks =
                stage.tasks.filter(
                    (task) =>
                        String(
                            task.TaskStatus || ""
                        ).toLowerCase() ===
                        "completed"
                ).length;


            stageProgresses.push(
                (
                    completedTasks /
                    totalTasks
                ) * 100
            );

        }


        const overallProgress =
            stageProgresses.length === 0
                ? 0
                : stageProgresses.reduce(
                      (sum, value) =>
                          sum + value,
                      0
                  ) /
                  stageProgresses.length;


        return {

            ...project,

            overallProgress:
                Number(
                    overallProgress.toFixed(2)
                )

        };

    });

};

const getprojects = async (user) => {

    let result;


    if (
        user.RoleName === Roles.ADMIN ||
        user.RoleName === Roles.PMO_MANAGER
    ) {

        result = await sql.query`

            SELECT *

            FROM Projects

            ORDER BY CreatedAt DESC

        `;

    }



    else if (
        user.RoleName === Roles.DEPARTMENT_MANAGER
    ) {

        result = await sql.query`

            SELECT DISTINCT
                p.*

            FROM Projects p

            INNER JOIN ProjectDepartments pd
                ON p.ProjectID = pd.ProjectID

            WHERE
                pd.DepartmentID = ${user.DepartmentID}

            ORDER BY
                p.CreatedAt DESC

        `;

    }


    else if (
        user.RoleName === Roles.PROJECT_MANAGER
    ) {

        result = await sql.query`

            SELECT *

            FROM Projects

            WHERE
                ProjectManagerID = ${user.UserID}

            ORDER BY
                CreatedAt DESC

        `;

    }



    else if (
        user.RoleName === Roles.EMPLOYEE
    ) {

        result = await sql.query`

            SELECT DISTINCT
                p.*

            FROM Projects p

            INNER JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            WHERE
                t.AssignedTo = ${user.UserID}

            ORDER BY
                p.CreatedAt DESC

        `;

    }


    else {

        const error =
            new Error("Forbidden.");

        error.statusCode = 403;

        throw error;

    }



    const projects =
        await attachProgressToProjects(
            result.recordset
        );


    return {

        projects

    };

};

const getprojectsById = async (id, user) => {

    let result;




    if (
        user.RoleName === Roles.ADMIN ||
        user.RoleName === Roles.PMO_MANAGER
    ) {

        result = await sql.query`

            SELECT *

            FROM Projects

            WHERE
                ProjectID = ${id}

        `;

    }



    else if (
        user.RoleName === Roles.DEPARTMENT_MANAGER
    ) {

        result = await sql.query`

            SELECT DISTINCT
                p.*

            FROM Projects p

            INNER JOIN ProjectDepartments pd
                ON p.ProjectID = pd.ProjectID

            WHERE
                p.ProjectID = ${id}

                AND pd.DepartmentID =
                    ${user.DepartmentID}

        `;

    }




    else if (
        user.RoleName === Roles.PROJECT_MANAGER
    ) {

        result = await sql.query`

            SELECT *

            FROM Projects

            WHERE
                ProjectID = ${id}

                AND ProjectManagerID =
                    ${user.UserID}

        `;

    }



    else if (
        user.RoleName === Roles.EMPLOYEE
    ) {

        result = await sql.query`

            SELECT DISTINCT
                p.*

            FROM Projects p

            INNER JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID

            WHERE
                p.ProjectID = ${id}

                AND t.AssignedTo =
                    ${user.UserID}

        `;

    }



    else {

        const error =
            new Error("Forbidden.");

        error.statusCode = 403;

        throw error;

    }



    if (
        result.recordset.length === 0
    ) {

        const error =
            new Error(
                "Project not found or access denied."
            );

        error.statusCode = 404;

        throw error;

    }



    const [project] =
        await attachProgressToProjects(
            result.recordset
        );


    return project;

};

const createproject = async (
    data,
    createdBy
) => {

    const {

        projectName,
        projectDescription,
        projectType,
        priorityLevel,
        status,
        startDate,
        targetEndDate,
        projectManagerId,
        departmentIds,
        isStrategic,

    } = data;


    const result = await sql.query`

        INSERT INTO Projects
        (
            ProjectName,
            ProjectDescription,
            ProjectType,
            PriorityLevel,
            Status,
            StartDate,
            TargetEndDate,
            ActualEndDate,
            ProjectManagerID,
            IsStrategic,
            CreatedBy,
            CreatedAt
        )

        VALUES
        (
            ${projectName},
            ${projectDescription},
            ${projectType},
            ${priorityLevel},
            ${status},
            ${startDate},
            ${targetEndDate},
            NULL,
            ${projectManagerId},
            ${isStrategic},
            ${createdBy},
            GETDATE()
        );

        SELECT
            SCOPE_IDENTITY() AS ProjectID;

    `;


    const projectId =
        result.recordset[0].ProjectID;


    for (
        const departmentId
        of departmentIds
    ) {

        await sql.query`

            INSERT INTO ProjectDepartments
            (
                ProjectID,
                DepartmentID
            )

            VALUES
            (
                ${projectId},
                ${departmentId}
            )

        `;

    }


    return {

        message:
            "Project created successfully",

        projectId,

        projectName

    };

};

const updateProject = async (
    id,
    data
) => {

    const {

        projectName,
        projectDescription,
        projectType,
        priorityLevel,
        status,
        targetEndDate,
        projectManagerId,
        isStrategic,
        departmentIds

    } = data;


    const transaction =
        new sql.Transaction();


    try {

        await transaction.begin();


        const request =
            new sql.Request(
                transaction
            );



        request.input(
            "projectId",
            sql.Int,
            id
        );

        request.input(
            "projectName",
            sql.NVarChar,
            projectName ?? null
        );

        request.input(
            "projectDescription",
            sql.NVarChar,
            projectDescription ?? null
        );

        request.input(
            "projectType",
            sql.NVarChar,
            projectType ?? null
        );

        request.input(
            "priorityLevel",
            sql.NVarChar,
            priorityLevel ?? null
        );

        request.input(
            "status",
            sql.NVarChar,
            status ?? null
        );

        request.input(
            "targetEndDate",
            sql.Date,
            targetEndDate ?? null
        );

        request.input(
            "projectManagerId",
            sql.Int,
            projectManagerId ?? null
        );

        request.input(
            "isStrategic",
            sql.Bit,
            isStrategic ?? null
        );


        const result =
            await request.query(`

                UPDATE Projects

                SET

                    ProjectName =
                        COALESCE(
                            @projectName,
                            ProjectName
                        ),

                    ProjectDescription =
                        COALESCE(
                            @projectDescription,
                            ProjectDescription
                        ),

                    ProjectType =
                        COALESCE(
                            @projectType,
                            ProjectType
                        ),

                    PriorityLevel =
                        COALESCE(
                            @priorityLevel,
                            PriorityLevel
                        ),

                    Status =
                        COALESCE(
                            @status,
                            Status
                        ),

                    TargetEndDate =
                        COALESCE(
                            @targetEndDate,
                            TargetEndDate
                        ),

                    ProjectManagerID =
                        COALESCE(
                            @projectManagerId,
                            ProjectManagerID
                        ),

                    IsStrategic =
                        COALESCE(
                            @isStrategic,
                            IsStrategic
                        )

                OUTPUT

                    INSERTED.ProjectID,
                    INSERTED.ProjectName,
                    INSERTED.ProjectDescription,
                    INSERTED.ProjectType,
                    INSERTED.PriorityLevel,
                    INSERTED.Status,
                    INSERTED.TargetEndDate,
                    INSERTED.ProjectManagerID,
                    INSERTED.IsStrategic,
                    INSERTED.CreatedAt

                WHERE
                    ProjectID = @projectId;

            `);


        if (
            !result.recordset.length
        ) {

            throw new Error(
                "Project not found"
            );

        }



        if (
            Array.isArray(departmentIds)
        ) {

            const currentDepartmentsRequest =
                new sql.Request(
                    transaction
                );


            currentDepartmentsRequest.input(
                "projectId",
                sql.Int,
                id
            );


            const currentDepartmentsResult =
                await currentDepartmentsRequest.query(`

                    SELECT
                        DepartmentID

                    FROM ProjectDepartments

                    WHERE
                        ProjectID = @projectId

                `);


            const currentDepartmentIds =
                currentDepartmentsResult.recordset.map(
                    row =>
                        row.DepartmentID
                );


            const removedDepartmentIds =
                currentDepartmentIds.filter(
                    departmentId =>
                        !departmentIds.includes(
                            departmentId
                        )
                );


            for (
                const departmentId
                of removedDepartmentIds
            ) {

                const taskCheckRequest =
                    new sql.Request(
                        transaction
                    );


                taskCheckRequest.input(
                    "projectId",
                    sql.Int,
                    id
                );


                taskCheckRequest.input(
                    "departmentId",
                    sql.Int,
                    departmentId
                );


                const taskCheck =
                    await taskCheckRequest.query(`

                        SELECT TOP 1
                            TaskID

                        FROM ProjectTasks

                        WHERE
                            ProjectID =
                                @projectId

                            AND DepartmentID =
                                @departmentId

                    `);


                if (
                    taskCheck.recordset.length
                ) {

                    throw new Error(
                        `Cannot remove Department ${departmentId} because it has tasks in this project`
                    );

                }

            }


            if (
                removedDepartmentIds.length
            ) {

                const deleteRequest =
                    new sql.Request(
                        transaction
                    );


                deleteRequest.input(
                    "projectId",
                    sql.Int,
                    id
                );


                const placeholders =
                    removedDepartmentIds
                        .map(
                            (_, index) =>
                                `@departmentId${index}`
                        )
                        .join(", ");


                removedDepartmentIds.forEach(
                    (
                        departmentId,
                        index
                    ) => {

                        deleteRequest.input(
                            `departmentId${index}`,
                            sql.Int,
                            departmentId
                        );

                    }
                );


                await deleteRequest.query(`

                    DELETE FROM ProjectDepartments

                    WHERE
                        ProjectID =
                            @projectId

                        AND DepartmentID IN
                            (${placeholders})

                `);

            }

        }


        await transaction.commit();


        return result.recordset[0];

    }


    catch (error) {

        try {

            await transaction.rollback();

        }

        catch (rollbackError) {

            console.error(
                "Rollback failed:",
                rollbackError
            );

        }


        throw error;

    }

};

const deleteProject = async (
    id
) => {

    await sql.query`

        DELETE FROM Projects

        WHERE
            ProjectID = ${id};

    `;


    return {

        message:
            "project deleted"

    };

};

module.exports = {
    getprojects,
    createproject,
    updateProject,
    deleteProject,
    getprojectsById
};
