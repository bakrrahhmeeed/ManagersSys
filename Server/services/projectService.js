const sql = require("mssql")
const Roles = require("../constants/roles")



const getprojects = async(user) =>{

    let project = [];

    if(user.RoleName === Roles.ADMIN || user.RoleName === Roles.PMO_MANAGER){
        const result = await sql.query`
            SELECT * FROM Projects
        `
        projects = result.recordset

        return{
            projects
        }
        
        
    }

    if(user.RoleName === Roles.DEPARTMENT_MANAGER){
        const result = await sql.query`
        SELECT p.*
        FROM Projects p
        INNER JOIN ProjectDepartments pd
        ON p.ProjectID = pd.ProjectID
        WHERE pd.DepartmentID = ${user.DepartmentID};
        `
        return result.recordset
    }
    if(user.RoleName === Roles.PROJECT_MANAGER){
        const result = await sql.query`
            SELECT * FROM Projects WHERE PROJECTMANAGERID = ${user.UserID}
        `
        return result.recordset;
    }
}

const getprojectsById = async (id, user) => {
    if (
        user.RoleName === Roles.ADMIN ||
        user.RoleName === Roles.PMO_MANAGER
    ) {

        const result = await sql.query`
            SELECT *
            FROM Projects
            WHERE ProjectID = ${id}
        `;

        if (result.recordset.length === 0) {
            const error = new Error("Project not found.");
            error.statusCode = 404;
            throw error;
        }

        return result.recordset[0];
    }

    if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        const result = await sql.query`
            SELECT p.*
            FROM Projects p
            INNER JOIN ProjectDepartments pd
                ON p.ProjectID = pd.ProjectID
            WHERE
                p.ProjectID = ${id}
                AND pd.DepartmentID = ${user.DepartmentID}
        `;

        if (result.recordset.length === 0) {
            const error = new Error("Project not found or access denied.");
            error.statusCode = 404;
            throw error;
        }

        return result.recordset[0];
    }

    if (user.RoleName === Roles.PROJECT_MANAGER) {

        const result = await sql.query`
            SELECT *
            FROM Projects
            WHERE
                ProjectID = ${id}
                AND ProjectManagerID = ${user.UserID}
        `;

        if (result.recordset.length === 0) {
            const error = new Error("Project not found or access denied.");
            error.statusCode = 404;
            throw error;
        }

        return result.recordset[0];
    }

    if (user.RoleName === Roles.EMPLOYEE) {

        const result = await sql.query`
            SELECT DISTINCT p.*
            FROM Projects p
            INNER JOIN ProjectTasks t
                ON p.ProjectID = t.ProjectID
            WHERE
                p.ProjectID = ${id}
                AND t.AssignedToUserID = ${user.UserID}
        `;

        if (result.recordset.length === 0) {
            const error = new Error("Project not found or access denied.");
            error.statusCode = 404;
            throw error;
        }

        return result.recordset[0];
    }

    const error = new Error("Forbidden.");
    error.statusCode = 403;
    throw error;
};

const createproject = async (data, createdBy) => {

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
            ProgressPercent,
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
            0,
            ${startDate},
            ${targetEndDate},
            NULL,
            ${projectManagerId},
            ${isStrategic},
            ${createdBy},
            GETDATE()
        );

        SELECT SCOPE_IDENTITY() AS ProjectID;

    `;

    const projectId = result.recordset[0].ProjectID;

    for (const departmentId of departmentIds) {

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
        message: "Project created successfully",
        projectId,
        projectName
    };

};

const updateProject = async (id, data) => {

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

    const transaction = new sql.Transaction();

    try {

        await transaction.begin();

        const request = new sql.Request(transaction);

        // 1. Update Project
        request.input("projectId", sql.Int, id);
        request.input("projectName", sql.NVarChar, projectName ?? null);
        request.input("projectDescription", sql.NVarChar, projectDescription ?? null);
        request.input("projectType", sql.NVarChar, projectType ?? null);
        request.input("priorityLevel", sql.NVarChar, priorityLevel ?? null);
        request.input("status", sql.NVarChar, status ?? null);
        request.input("targetEndDate", sql.Date, targetEndDate ?? null);
        request.input("projectManagerId", sql.Int, projectManagerId ?? null);
        request.input("isStrategic", sql.Bit, isStrategic ?? null);

        const result = await request.query(`
            UPDATE Projects
            SET
                ProjectName = COALESCE(@projectName, ProjectName),
                ProjectDescription = COALESCE(@projectDescription, ProjectDescription),
                ProjectType = COALESCE(@projectType, ProjectType),
                PriorityLevel = COALESCE(@priorityLevel, PriorityLevel),
                Status = COALESCE(@status, Status),
                TargetEndDate = COALESCE(@targetEndDate, TargetEndDate),
                ProjectManagerID = COALESCE(@projectManagerId, ProjectManagerID),
                IsStrategic = COALESCE(@isStrategic, IsStrategic)

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

            WHERE ProjectID = @projectId;
        `);

        if (!result.recordset.length) {
            throw new Error("Project not found");
        }


        // 2. Handle Project Departments
        if (Array.isArray(departmentIds)) {

            // Departments currently assigned to this project
            const currentDepartmentsRequest = new sql.Request(transaction);

            currentDepartmentsRequest.input(
                "projectId",
                sql.Int,
                id
            );

            const currentDepartmentsResult =
                await currentDepartmentsRequest.query(`
                    SELECT DepartmentID
                    FROM ProjectDepartments
                    WHERE ProjectID = @projectId
                `);

            const currentDepartmentIds =
                currentDepartmentsResult.recordset.map(
                    row => row.DepartmentID
                );


            // Departments that were removed
            const removedDepartmentIds =
                currentDepartmentIds.filter(
                    departmentId =>
                        !departmentIds.includes(departmentId)
                );


            // 3. Check if removed departments have tasks
            for (const departmentId of removedDepartmentIds) {

                const taskCheckRequest =
                    new sql.Request(transaction);

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
                        SELECT TOP 1 TaskID
                        FROM ProjectTasks
                        WHERE ProjectID = @projectId
                        AND DepartmentID = @departmentId
                    `);

                if (taskCheck.recordset.length) {

                    throw new Error(
                        `Cannot remove Department ${departmentId} because it has tasks in this project`
                    );
                }
            }


            // 4. Delete departments that were removed
            if (removedDepartmentIds.length) {

                const deleteRequest =
                    new sql.Request(transaction);

                deleteRequest.input(
                    "projectId",
                    sql.Int,
                    id
                );

                const placeholders =
                    removedDepartmentIds
                        .map((_, index) => `@departmentId${index}`)
                        .join(", ");

                removedDepartmentIds.forEach(
                    (departmentId, index) => {

                        deleteRequest.input(
                            `departmentId${index}`,
                            sql.Int,
                            departmentId
                        );

                    }
                );

                await deleteRequest.query(`
                    DELETE FROM ProjectDepartments
                    WHERE ProjectID = @projectId
                    AND DepartmentID IN (${placeholders})
                `);
            }
        }


        await transaction.commit();

        return result.recordset[0];

    } catch (error) {

        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error("Rollback failed:", rollbackError);
        }

        throw error;
    }
};

const deleteProject = async(id)=>{
    const result = await sql.query`

    DELETE FROM Projects
    WHERE ProjectID = ${id};
    `

    return{
        message:"project deleted"
    }
}





module.exports ={
    getprojects,
    createproject,
    updateProject,
    deleteProject,
    getprojectsById
}
