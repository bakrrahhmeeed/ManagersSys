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

const updateProject = async(id , data)=>{

     const {
        projectName,
        projectDescription,
        projectType,
        priorityLevel,
        status,
        targetEndDate,
        sponsorId,
        projectManagerId,
        departmentId,
        isStrategic,
   
    }= data;

    const result = await sql.query`

        UPDATE Projects
        SET
            ProjectName = COALESCE(${projectName}, ProjectName),
            ProjectDescription = COALESCE(${projectDescription}, ProjectDescription),
            ProjectType = COALESCE(${projectType}, ProjectType),
            PriorityLevel = COALESCE(${priorityLevel}, PriorityLevel),
            Status = COALESCE(${status}, Status),
            TargetEndDate = COALESCE(${targetEndDate}, TargetEndDate),
            SponsorID = COALESCE(${sponsorId}, SponsorID),
            ProjectManagerID = COALESCE(${projectManagerId}, ProjectManagerID),
            DepartmentID = COALESCE(${departmentId}, DepartmentID),
            IsStrategic = COALESCE(${isStrategic}, IsStrategic)

        OUTPUT
            INSERTED.ProjectID,
            INSERTED.ProjectName,
            INSERTED.ProjectDescription,
            INSERTED.ProjectType,
            INSERTED.PriorityLevel,
            INSERTED.Status,
            INSERTED.TargetEndDate,
            INSERTED.SponsorID,
            INSERTED.ProjectManagerID,
            INSERTED.DepartmentID,
            INSERTED.IsStrategic,
            INSERTED.CreatedAt
        WHERE ProjectID = ${id};

    `;

    if (!result.recordset.length) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
}


return{
    message: "Project updated successfully",
  
}
}

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
