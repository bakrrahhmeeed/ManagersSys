const sql = require('mssql');


const getAllStages = async () => {
    const result = await sql.query`select * from ProjectStages`;
    return result.recordset;
};

const createStage = async (data)=>{

     const { 
        projectId,
        stageName,
        stageOrder,
        endDate,
        responsibleUserId,
        notes,
        departmentId } = data;

    if (!projectId || !stageName || !stageOrder || !endDate || !responsibleUserId || !departmentId) {
        throw new Error("Missing required fields");
    }

    const existingStage = await sql.query`
        SELECT * FROM ProjectStages
        WHERE ProjectID = ${projectId} AND StageOrder = ${stageOrder}
    `;

    if (existingStage.recordset.length > 0) {
        throw new Error("A stage with the same order already exists for this project");
    }

    const existingStageName = await sql.query`
        SELECT * FROM ProjectStages
        WHERE ProjectID = ${projectId} AND StageName = ${stageName}
    `;

    if (existingStageName.recordset.length > 0) {
        throw new Error("A stage with the same name already exists for this project");
    }

  const project = await sql.query`
    SELECT ProjectID
    FROM Projects
    WHERE ProjectID = ${projectId}
`;

if (project.recordset.length === 0) {
    const error = new Error("Project not found.");
    error.statusCode = 404;
    throw error;
}

const user = await sql.query`
    SELECT UserID
    FROM Users
    WHERE UserID = ${responsibleUserId}
`;

if (user.recordset.length === 0) {
    const error = new Error("Responsible user not found.");
    error.statusCode = 404;
    throw error;
}

const department = await sql.query`
    SELECT DepartmentID
    FROM Departments
    WHERE DepartmentID = ${departmentId}
`;

if (department.recordset.length === 0) {
    const error = new Error("Department not found.");
    error.statusCode = 404;
    throw error;
}

    

    const result = await sql.query`

    INSERT INTO ProjectStages
    (
        ProjectID,

        StageName,

        StageOrder,

        Status,

        ProgressPercent,

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

        INSERTED.ProgressPercent,

        INSERTED.StartDate,

        INSERTED.EndDate,

        INSERTED.ActualEndDate,

        INSERTED.ResponsibleUserID,

        INSERTED.Notes,

        INSERTED.DepartmentID

    VALUES

    (

        ${projectId},

        ${stageName},

        ${stageOrder},

        ${"Not Started"},

        ${0},

        GETDATE(),

        ${endDate},

        ${null},

        ${responsibleUserId},

        ${notes},

        ${departmentId}

    );
`;

return {
    message: "Stage created successfully",
    stage: result.recordset[0]
};
}

const updateStage = async (id, data) => {

    const {
        stageName,
        stageOrder,
        status,
        progressPercent,
        endDate,
        actualEndDate,
        responsibleUserId,
        notes,
        departmentId
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

    const finalStatus = status ?? currentStage.Status;
    const finalProgress = progressPercent ?? currentStage.ProgressPercent;
    const finalActualEndDate = actualEndDate ?? currentStage.ActualEndDate;

   

    if (finalProgress < 0 || finalProgress > 100) {
        const error = new Error("Progress must be between 0 and 100.");
        error.statusCode = 400;
        throw error;
    }

    if (finalStatus === "Completed" && finalProgress !== 100) {
        const error = new Error("Completed stage must have 100% progress.");
        error.statusCode = 400;
        throw error;
    }

    if (finalStatus === "Not Started" && finalProgress > 0) {
        const error = new Error("Not Started stage must have 0% progress.");
        error.statusCode = 400;
        throw error;
    }

    if (finalStatus === "Completed" && !finalActualEndDate) {
        const error = new Error("Actual end date is required when the stage is completed.");
        error.statusCode = 400;
        throw error;
    }

    if (
    finalStatus !== "Completed" &&
    finalActualEndDate
) {
    const error = new Error(
        "Actual end date can only be set when the stage is completed."
    );
    error.statusCode = 400;
    throw error;
}

    const result = await sql.query`
        UPDATE ProjectStages
        SET
            StageName = COALESCE(${stageName}, StageName),
            StageOrder = COALESCE(${stageOrder}, StageOrder),
            Status = COALESCE(${status}, Status),
            ProgressPercent = COALESCE(${progressPercent}, ProgressPercent),
            EndDate = COALESCE(${endDate}, EndDate),
            ActualEndDate = COALESCE(${actualEndDate}, ActualEndDate),
            ResponsibleUserID = COALESCE(${responsibleUserId}, ResponsibleUserID),
            Notes = COALESCE(${notes}, Notes),
            DepartmentID = COALESCE(${departmentId}, DepartmentID)

        OUTPUT
            INSERTED.StageID,
            INSERTED.ProjectID,
            INSERTED.StageName,
            INSERTED.StageOrder,
            INSERTED.Status,
            INSERTED.ProgressPercent,
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

const getStage = async (id) => {

    const result = await sql.query`
        SELECT
            s.*,
            p.ProjectName,
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

    return result.recordset[0];
};


module.exports = {
  getAllStages,
  createStage,
  updateStage,
  deleteStage,
  getStage
};