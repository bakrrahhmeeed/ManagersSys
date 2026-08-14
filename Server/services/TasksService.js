const sql = require('mssql');


const getAllTasks = async () => {
    const result = await sql.query`
SELECT
    t.TaskID,
    t.ProjectID,
    t.StageID,
    t.TaskTitle,
    t.TaskDescription,
    t.AssignedTo,
    u.FullName AS AssignedTo,
    t.PriorityLevel AS PriorityLevel,
    t.Status,
    t.ProgressPercent,
    t.DueDate,
    t.CompletedDate,
    t.Blocker,
    t.CreatedBy,
    t.CreatedAt,
    s.StageName,
    p.ProjectName,
    t.DepartmentID,
    d.DepartmentName
FROM ProjectTasks t

LEFT JOIN Users u
    ON t.AssignedTo = u.UserID

LEFT JOIN ProjectStages s
    ON t.StageID = s.StageID

LEFT JOIN Projects p
    ON t.ProjectID = p.ProjectID

LEFT JOIN Departments d
    ON t.DepartmentID = d.DepartmentID

ORDER BY t.TaskID DESC

    `;
    return result.recordset;
};

const createTask = async (data, userID) => {

    const {
        projectId,
        StageID,
        TaskTitle,
        TaskDescription,
        AssignedToUserID,
        priority,
        dueDate
    } = data;

    // Required fields
    if (
        !projectId ||
        !StageID ||
        !TaskTitle ||
        !TaskDescription ||
        !AssignedToUserID ||
        !priority ||
        !dueDate
    ) {
        throw new Error("Missing required fields");
    }

    // 1. Check Project exists
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

    // 2. Get Stage + Department + Status
    const stage = await sql.query`
        SELECT
            StageID,
            ProjectID,
            DepartmentID,
            Status
        FROM ProjectStages
        WHERE StageID = ${StageID}
        AND ProjectID = ${projectId}
    `;

    if (stage.recordset.length === 0) {
        const error = new Error(
            "Stage not found for the given project."
        );
        error.statusCode = 404;
        throw error;
    }

    const stageData = stage.recordset[0];

    // 3. Department comes from the selected Stage
    const departmentId = stageData.DepartmentID;

    if (!departmentId) {
        const error = new Error(
            "Cannot create a task because the selected stage has no department."
        );
        error.statusCode = 400;
        throw error;
    }

    // 4. Cannot create Task in completed Stage
    if (stageData.Status === "Completed") {
        const error = new Error(
            "Cannot create a task in a completed stage."
        );
        error.statusCode = 400;
        throw error;
    }

    // 5. Check Assigned User exists and is active
    const user = await sql.query`
        SELECT UserID
        FROM Users
        WHERE UserID = ${AssignedToUserID}
        AND IsActive = 1
    `;

    if (user.recordset.length === 0) {
        const error = new Error(
            "Assigned user not found."
        );
        error.statusCode = 404;
        throw error;
    }

    // 6. Due date cannot be in the past
    if (new Date(dueDate) < new Date()) {
        const error = new Error(
            "Due date cannot be in the past."
        );
        error.statusCode = 400;
        throw error;
    }

    // 7. Create Task
    const result = await sql.query`
        INSERT INTO ProjectTasks
        (
            ProjectID,
            StageID,
            DepartmentID,
            TaskTitle,
            TaskDescription,
            AssignedTo,
            PriorityLevel,
            Status,
            ProgressPercent,
            DueDate,
            CompletedDate,
            CreatedBy,
            CreatedAt,
            Blocker
        )
        OUTPUT
            INSERTED.TaskID,
            INSERTED.ProjectID,
            INSERTED.StageID,
            INSERTED.DepartmentID,
            INSERTED.TaskTitle,
            INSERTED.TaskDescription,
            INSERTED.AssignedTo,
            INSERTED.PriorityLevel,
            INSERTED.Status,
            INSERTED.ProgressPercent,
            INSERTED.DueDate,
            INSERTED.CompletedDate,
            INSERTED.CreatedBy,
            INSERTED.CreatedAt,
            INSERTED.Blocker
        VALUES
        (
            ${projectId},
            ${StageID},
            ${departmentId},
            ${TaskTitle},
            ${TaskDescription},
            ${AssignedToUserID},
            ${priority},
            ${"Not Started"},
            0,
            ${dueDate},
            NULL,
            ${userID},
            GETDATE(),
            NULL
        )
    `;

    return {
        message: "Task created successfully",
        task: result.recordset[0]
    };
};

const updateTask = async (taskId, data) => {
    const { 
        TaskTitle,
        TaskDescription,
        AssignedToUserID,
        priority,
        Status,
        ProgressPercent,
        DueDate,
        CompletedDate,
        Blocker
    } = data;

    const existingTask = await sql.query`
        SELECT *
        FROM ProjectTasks
        WHERE TaskID = ${taskId}
    `;

    if (existingTask.recordset.length === 0) {
        const error = new Error("Task not found.");
        error.statusCode = 404;
        throw error;
    }

    const currentTask = existingTask.recordset[0];

    const finalStatus = Status ?? currentTask.Status;
    const finalProgress = ProgressPercent ?? currentTask.ProgressPercent;
    const finalDueDate = DueDate ?? currentTask.DueDate;
    const finalCompletedDate = CompletedDate ?? currentTask.CompletedDate;

    if (finalProgress < 0 || finalProgress > 100) {
        const error = new Error("Progress must be between 0 and 100.");
        error.statusCode = 400;
        throw error;
    }

    if (finalStatus === "Completed" && !finalCompletedDate) {
        const error = new Error("Completed date must be provided when marking a task as completed.");
        error.statusCode = 400;
        throw error;
    }

    if (finalStatus !== "Completed" && finalCompletedDate) {
        const error = new Error("Completed date should only be set when the task is marked as completed.");
        error.statusCode = 400;
        throw error;
    }

    if (finalStatus === "Completed" && finalProgress !== 100) {
    const error = new Error("Completed task must have 100% progress.");
    error.statusCode = 400;
    throw error;
}

if (AssignedToUserID !== undefined) {

    const user = await sql.query`
        SELECT UserID
        FROM Users
        WHERE UserID = ${AssignedToUserID}
        AND IsActive = 1
    `;

    if(user.recordset.length === 0){

        const error = new Error("Assigned user not found.");
        error.statusCode = 404;
        throw error;

    }

}

    await sql.query`
        UPDATE ProjectTasks
        SET 
            TaskTitle = COALESCE(${TaskTitle}, TaskTitle),
            TaskDescription = COALESCE(${TaskDescription}, TaskDescription),
            AssignedToUserID = COALESCE(${AssignedToUserID}, AssignedToUserID),
            PriorityLevel = COALESCE(${priority}, PriorityLevel),
            Status = COALESCE(${finalStatus}, Status),
            ProgressPercent = COALESCE(${finalProgress}, ProgressPercent),
            DueDate = COALESCE(${finalDueDate}, DueDate),
            CompletedDate = COALESCE(${finalCompletedDate}, CompletedDate),
            Blocker = COALESCE(${Blocker}, Blocker)
        WHERE TaskID = ${taskId}
    `;

    const updatedTask = await sql.query`
        SELECT *
        FROM ProjectTasks
        WHERE TaskID = ${taskId}
    `;

    return {
        message: "Task updated successfully",
        task: updatedTask.recordset[0]
    };
};

const deleteTask = async (taskId) => {

    const result = await sql.query`
        DELETE FROM ProjectTasks
        WHERE TaskID = ${taskId}
    `;

    if (result.rowsAffected[0] === 0) {
        const error = new Error("Task not found.");
        error.statusCode = 404;
        throw error;
    }

    return {
        message: "Task deleted successfully"
    };
};

const getTask = async (taskId) => {
    const result = await sql.query`
        SELECT
    t.*,
            t.AssignedTo AS AssignedToUserID,
            u.FullName AS AssignedToName,
    s.StageName,
    p.ProjectName
FROM ProjectTasks t
JOIN Users u
    ON t.AssignedTo = u.UserID
JOIN ProjectStages s
    ON t.StageID = s.StageID
JOIN Projects p
    ON t.ProjectID = p.ProjectID
WHERE t.TaskID = ${taskId}
    `;


    const comments = await sql.query`
    SELECT * FROM Comments
    WHERE ReferenceID =  ${taskId}`
    

    if (result.recordset.length === 0) {
        const error = new Error("Task not found.");
        error.statusCode = 404;
        throw error;
    }

    return [ 
        result.recordset,
        comments.recordset
        
    ]
};

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getTask
};  
