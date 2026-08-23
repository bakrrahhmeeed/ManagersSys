const sql = require('mssql');
const Roles = require("../constants/roles")


const getAllTasks = async (user) => {



    if (user.RoleName === Roles.ADMIN || user.RoleName === Roles.PMO_MANAGER) {

        const result = await sql.query`
            SELECT
                t.TaskID,
                t.ProjectID,
                t.StageID,
                t.TaskTitle,
                t.TaskDescription,
                t.AssignedTo,
                u.FullName AS AssignedToName,
                t.PriorityLevel,
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
    }



    if (user.RoleName === Roles.PROJECT_MANAGER) {

        const result = await sql.query`
            SELECT
                t.TaskID,
                t.ProjectID,
                t.StageID,
                t.TaskTitle,
                t.TaskDescription,
                t.AssignedTo,
                u.FullName AS AssignedToName,
                t.PriorityLevel,
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

            WHERE p.ProjectManagerID = ${user.UserID}

            ORDER BY t.TaskID DESC
        `;

        return result.recordset;
    }


  

    if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        const result = await sql.query`
            SELECT
                t.TaskID,
                t.ProjectID,
                t.StageID,
                t.TaskTitle,
                t.TaskDescription,
                t.AssignedTo,
                u.FullName AS AssignedToName,
                t.PriorityLevel,
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

            WHERE t.DepartmentID = ${user.DepartmentID}

            ORDER BY t.TaskID DESC
        `;

        return result.recordset;
    }



    if (user.RoleName === Roles.EMPLOYEE) {

        const result = await sql.query`
            SELECT
                t.TaskID,
                t.ProjectID,
                t.StageID,
                t.TaskTitle,
                t.TaskDescription,
                t.AssignedTo,
                u.FullName AS AssignedToName,
                t.PriorityLevel,
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

            WHERE t.AssignedTo = ${user.UserID}

            ORDER BY t.TaskID DESC
        `;

        return result.recordset;
    }




    const error = new Error("Access denied.");
    error.statusCode = 403;
    throw error;
};

const createTask = async (data, user) => {

    const {
        projectId,
        StageID,
        TaskTitle,
        TaskDescription,
        AssignedToUserID,
        priority,
        dueDate
    } = data;


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



    const project = await sql.query`
        SELECT
            ProjectID,
            ProjectManagerID
        FROM Projects
        WHERE ProjectID = ${projectId}
    `;

    if (project.recordset.length === 0) {
        const error = new Error("Project not found.");
        error.statusCode = 404;
        throw error;
    }



        const checkStage = await sql.query`
    SELECT STATUS FROM PROJECTSTAGES WHERE STAGEID = ${StageID}`

    const stagestatus = checkStage.recordset[0]
    console.log(stagestatus.STATUS)

    if(stagestatus.STATUS === "Not Started"){
        throw new Error("Stage Status is 'Not Started' Please check and try again");
        error.statusCode = 400;
        throw error;
    }
    

    const projectData = project.recordset[0];



    if (user.RoleName === Roles.PROJECT_MANAGER) {

        if (projectData.ProjectManagerID !== user.UserID) {

            const error = new Error(
                "You can only create tasks in projects you manage."
            );

            error.statusCode = 403;
            throw error;
        }
    }




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

    const departmentId = stageData.DepartmentID;




    if (!departmentId) {
        const error = new Error(
            "Cannot create a task because the selected stage has no department."
        );

        error.statusCode = 400;
        throw error;
    }




    if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        if (departmentId !== user.DepartmentID) {

            const error = new Error(
                "You can only create tasks for your department."
            );

            error.statusCode = 403;
            throw error;
        }
    }




    if (stageData.Status === "Completed") {

        const error = new Error(
            "Cannot create a task in a completed stage."
        );

        error.statusCode = 400;
        throw error;
    }



    const assignedUser = await sql.query`
        SELECT
            UserID
        FROM Users
        WHERE UserID = ${AssignedToUserID}
        AND DepartmentID = ${departmentId}
        AND IsActive = 1
    `;

    if (assignedUser.recordset.length === 0) {

        const error = new Error(
            "Assigned user must belong to the task department."
        );

        error.statusCode = 400;
        throw error;
    }




    if (new Date(dueDate) < new Date()) {

        const error = new Error(
            "Due date cannot be in the past."
        );

        error.statusCode = 400;
        throw error;
    }


  

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
            ${user.UserID},
            GETDATE(),
            NULL
        )
    `;




    return {
        message: "Task created successfully",
        task: result.recordset[0]
    };
};

const updateTask = async (taskId, data, user) => {

    const {
        TaskTitle,
        TaskDescription,
        AssignedToUserID,
        priority,
        Status,
        DueDate,
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


    if (currentTask.Status === "Completed") {

        const error = new Error(
            "Completed tasks cannot be modified."
        );

        error.statusCode = 403;
        throw error;
    }


    const departmentId =
        currentTask.DepartmentID;


    if (user.RoleName === Roles.PROJECT_MANAGER) {

        const project = await sql.query`
            SELECT ProjectID
            FROM Projects
            WHERE ProjectID = ${currentTask.ProjectID}
            AND ProjectManagerID = ${user.UserID}
        `;


        if (project.recordset.length === 0) {

            const error = new Error(
                "You can only update tasks in projects you manage."
            );

            error.statusCode = 403;
            throw error;
        }
    }


    if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        if (
            departmentId !==
            user.DepartmentID
        ) {

            const error = new Error(
                "You can only update tasks belonging to your department."
            );

            error.statusCode = 403;
            throw error;
        }
    }


    const finalStatus =
        Status ?? currentTask.Status;


    const finalDueDate =
        DueDate ?? currentTask.DueDate;


    const allowedStatuses = [
        "Not Started",
        "In Progress",
        "Blocked",
        "Completed"
    ];


    if (!allowedStatuses.includes(finalStatus)) {

        const error = new Error(
            "Invalid task status."
        );

        error.statusCode = 400;
        throw error;
    }


    let finalCompletedDate = null;


    if (finalStatus === "Completed") {
        finalCompletedDate = new Date();
    }


    let finalBlocker = null;


    if (finalStatus === "Blocked") {

        if (
            typeof Blocker !== "string" ||
            !Blocker.trim()
        ) {

            const error = new Error(
                "Blocker description is required when task is blocked."
            );

            error.statusCode = 400;
            throw error;
        }


        finalBlocker =
            Blocker.trim();
    }


    if (AssignedToUserID !== undefined) {

        const assignedUser = await sql.query`
            SELECT UserID
            FROM Users
            WHERE UserID = ${AssignedToUserID}
            AND DepartmentID = ${departmentId}
            AND IsActive = 1
        `;


        if (
            assignedUser.recordset.length === 0
        ) {

            const error = new Error(
                "Assigned user must belong to the task department."
            );

            error.statusCode = 400;
            throw error;
        }
    }


    await sql.query`
        UPDATE ProjectTasks
        SET

            TaskTitle =
                COALESCE(
                    ${TaskTitle},
                    TaskTitle
                ),

            TaskDescription =
                COALESCE(
                    ${TaskDescription},
                    TaskDescription
                ),

            AssignedTo =
                COALESCE(
                    ${AssignedToUserID},
                    AssignedTo
                ),

            PriorityLevel =
                COALESCE(
                    ${priority},
                    PriorityLevel
                ),

            Status =
                ${finalStatus},

            DueDate =
                COALESCE(
                    ${finalDueDate},
                    DueDate
                ),

            CompletedDate =
                ${finalCompletedDate},

            Blocker =
                ${finalBlocker}

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

const updateTaskEmbloyee = async (taskId, data, user) => {

    const {
        Status,
        Blocker
    } = data;


    const existingTask = await sql.query`
        SELECT
            TaskID,
            ProjectID,
            AssignedTo,
            Status,
            CompletedDate,
            Blocker
        FROM ProjectTasks
        WHERE TaskID = ${taskId}
    `;


    if (existingTask.recordset.length === 0) {

        const error = new Error("Task not found.");
        error.statusCode = 404;
        throw error;
    }


    const currentTask = existingTask.recordset[0];



    if (currentTask.AssignedTo !== user.UserID) {

        const error = new Error(
            "You can only update tasks assigned to you."
        );

        error.statusCode = 403;
        throw error;
    }


    if (currentTask.Status === "Completed") {

        const error = new Error(
            "Completed tasks cannot be updated."
        );

        error.statusCode = 403;
        throw error;
    }



    const finalStatus =
        Status !== undefined
            ? Status
            : currentTask.Status;


    const allowedStatuses = [
        "Not Started",
        "In Progress",
        "Blocked",
        "Completed"
    ];


    if (!allowedStatuses.includes(finalStatus)) {

        const error = new Error(
            "Invalid task status."
        );

        error.statusCode = 400;
        throw error;
    }




    let finalBlocker = null;


    if (finalStatus === "Blocked") {

        if (
            typeof Blocker !== "string" ||
            !Blocker.trim()
        ) {

            const error = new Error(
                "Blocker description is required when task is blocked."
            );

            error.statusCode = 400;
            throw error;
        }


        finalBlocker = Blocker.trim();
    }



    await sql.query`
        UPDATE ProjectTasks
        SET
            Status = ${finalStatus},

            CompletedDate =
                CASE
                    WHEN ${finalStatus} = 'Completed'
                        THEN GETDATE()
                    ELSE NULL
                END,

            Blocker = ${finalBlocker}

        WHERE TaskID = ${taskId}
        AND AssignedTo = ${user.UserID}
    `;




    const updatedTask = await sql.query`
        SELECT
            t.*,
            u.FullName AS AssignedToName,
            s.StageName,
            p.ProjectName,
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

        WHERE t.TaskID = ${taskId}
    `;


    return {
        message: "Task status updated successfully.",
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

const getTask = async (taskId, user) => {

    let result;



    if (user.RoleName === Roles.ADMIN || user.RoleName === Roles.PMO_MANAGER) {

        result = await sql.query`
            SELECT
                t.*,
                t.AssignedTo AS AssignedToUserID,
                u.FullName AS AssignedToName,
                s.StageName,
                p.ProjectName,
                d.DepartmentName AS DepartmentName

            FROM ProjectTasks t

            JOIN Users u
                ON t.AssignedTo = u.UserID

            JOIN ProjectStages s
                ON t.StageID = s.StageID

            JOIN Projects p
                ON t.ProjectID = p.ProjectID

            LEFT JOIN Departments d
                ON t.DepartmentID = d.DepartmentID

            WHERE t.TaskID = ${taskId}
        `;
    }




    else if (user.RoleName === Roles.PROJECT_MANAGER) {

        result = await sql.query`
            SELECT
                t.*,
                t.AssignedTo AS AssignedToUserID,
                u.FullName AS AssignedToName,
                s.StageName,
                p.ProjectName,
                d.DepartmentName AS DepartmentName

            FROM ProjectTasks t

            JOIN Users u
                ON t.AssignedTo = u.UserID

            JOIN ProjectStages s
                ON t.StageID = s.StageID

            JOIN Projects p
                ON t.ProjectID = p.ProjectID

            LEFT JOIN Departments d
                ON t.DepartmentID = d.DepartmentID

            WHERE t.TaskID = ${taskId}
            AND p.ProjectManagerID = ${user.UserID}
        `;
    }




    else if (user.RoleName === Roles.DEPARTMENT_MANAGER) {

        result = await sql.query`
            SELECT
                t.*,
                t.AssignedTo AS AssignedToUserID,
                u.FullName AS AssignedToName,
                s.StageName,
                p.ProjectName,
                d.DepartmentName AS DepartmentName

            FROM ProjectTasks t

            JOIN Users u
                ON t.AssignedTo = u.UserID

            JOIN ProjectStages s
                ON t.StageID = s.StageID

            JOIN Projects p
                ON t.ProjectID = p.ProjectID

            LEFT JOIN Departments d
                ON t.DepartmentID = d.DepartmentID

            WHERE t.TaskID = ${taskId}
            AND t.DepartmentID = ${user.DepartmentID}
        `;
    }




    else if (user.RoleName === Roles.EMPLOYEE) {

        result = await sql.query`
            SELECT
                t.*,
                t.AssignedTo AS AssignedToUserID,
                u.FullName AS AssignedToName,
                s.StageName,
                p.ProjectName,
                d.DepartmentName AS DepartmentName

            FROM ProjectTasks t

            JOIN Users u
                ON t.AssignedTo = u.UserID

            JOIN ProjectStages s
                ON t.StageID = s.StageID

            JOIN Projects p
                ON t.ProjectID = p.ProjectID

            LEFT JOIN Departments d
                ON t.DepartmentID = d.DepartmentID

            WHERE t.TaskID = ${taskId}
            AND t.AssignedTo = ${user.UserID}
        `;
    }




    else {

        const error = new Error("Access denied.");
        error.statusCode = 403;
        throw error;
    }


 

    if (result.recordset.length === 0) {
        const error = new Error(
            "Task not found or you do not have access to this task."
        );

        error.statusCode = 404;
        throw error;
    }


 

    const comments = await sql.query`
        SELECT
            c.*,
            u.FullName AS CreatedByName
        FROM Comments c

        LEFT JOIN Users u
            ON c.CreatedBy = u.UserID

        WHERE c.ReferenceID = ${taskId}
    `;




    return [
        result.recordset,
        comments.recordset
    ];
};

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getTask,
  updateTaskEmbloyee
};  
