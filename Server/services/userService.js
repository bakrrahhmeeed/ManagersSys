const sql = require("mssql")
const bcrypt = require("bcrypt")
const Roles = require("../constants/roles");



const getusers = async (user) => {
    const ID = user.UserID;
    const UserName = user.UserName;
    const RoleName = user.RoleName;
    const DepartmentID = user.DepartmentID;

    if(RoleName === Roles.ADMIN  || RoleName === Roles.PMO_MANAGER){
            const result = await sql.query`
SELECT
    u.UserID,
    u.FullName,
    u.UserName,
    u.Email,
    u.IsActive,

    u.DepartmentID,
    d.DepartmentName,

    u.BranchID,
    b.BranchName

FROM dbo.Users u

LEFT JOIN dbo.Departments d
    ON u.DepartmentID = d.DepartmentID

LEFT JOIN dbo.Branches b
    ON u.BranchID = b.BranchID;
      `;
  
      const users = result.recordset;
     

        return {

            users: result.recordset

        };
  };
    if(RoleName === "Department Manager"){
      const result = await sql.query`
        SELECT
        UserID,
        FullName,
        UserName,
        Email,
        IsActive,
        DepartmentID,
        BranchID
        FROM dbo.Users where DepartmentID = ${DepartmentID};
      `;
        return {
            users: result.recordset
        };
    }
};

const addUser = async (data) => {
    const {
        fullName,
        userName,
        Email,
        Password,
        departmentId,
        branchId,
        IsActive,
        role
    } = data;

   
    const hashedPassword = await bcrypt.hash(Password, 10);

    const result = await sql.query`
        INSERT INTO Users
        (
            FullName,
            UserName,
            Email,
            PasswordHash,
            DepartmentID,
            BranchID,
            IsActive
        )

        OUTPUT INSERTED.UserID

        VALUES
        (
            ${fullName},
            ${userName},
            ${Email},
            ${hashedPassword},
            ${departmentId},
            ${branchId},
            ${IsActive}
        );
    `;

    const userId = result.recordset[0].UserID;

    await sql.query`
        INSERT INTO UserRoles
        (
            UserID,
            RoleID
        )
        VALUES
        (
            ${userId},
            ${role}
        );
    `;

    return {
        message: "User added successfully",
        userId: userId,
        userName: userName
    };
};

const updateUser = async (id, data) => {
    const {
        fullName,
        userName,
        Email,
        departmentId,
        branchId,
        IsActive,
        role
    } = data;

    const result = await sql.query`
        UPDATE Users
        SET
            FullName = COALESCE(${fullName}, FullName),
            UserName = COALESCE(${userName}, UserName),
            Email = COALESCE(${Email}, Email),
            DepartmentID = COALESCE(${departmentId}, DepartmentID),
            BranchID = COALESCE(${branchId}, BranchID),
            IsActive = COALESCE(${IsActive}, IsActive)

        OUTPUT
            INSERTED.UserID,
            INSERTED.FullName,
            INSERTED.UserName,
            INSERTED.Email,
            INSERTED.DepartmentID,
            INSERTED.BranchID,
            INSERTED.IsActive,
            INSERTED.CreatedAt

        WHERE UserID = ${id};
    `;

    if (role !== undefined && role !== null) {
        await sql.query`
            UPDATE UserRoles
            SET RoleID = ${role}
            WHERE UserID = ${id};
        `;
    }

    return result.recordset[0];
};

const deleteUser = async(id )=>{
    
    
    const result = await sql.query`
      DELETE FROM Users
      WHERE UserID = ${id};
    `

    return {
      message:"usere deleted"
    }
};

const getuserById = async (id, user) => {


    const userResult = await sql.query`
        SELECT
            u.UserID,
            u.FullName,
            u.UserName,
            u.Email,

            u.DepartmentID,
            d.DepartmentName,

            u.BranchID,
            b.BranchName,

            u.IsActive,
            u.CreatedAt,

            r.RoleName

        FROM Users u

        LEFT JOIN Departments d
            ON u.DepartmentID = d.DepartmentID

        LEFT JOIN Branches b
            ON u.BranchID = b.BranchID

        LEFT JOIN UserRoles ur
            ON u.UserID = ur.UserID

        LEFT JOIN Roles r
            ON ur.RoleID = r.RoleID

        WHERE u.UserID = ${id}
    `;




    if (userResult.recordset.length === 0) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
    }


    const targetUser = userResult.recordset[0];




    if (
        user.RoleName === Roles.DEPARTMENT_MANAGER &&
        user.DepartmentID !== targetUser.DepartmentID
    ) {
        const error = new Error(
            "You can only view users from your department."
        );

        error.statusCode = 403;
        throw error;
    }



    let tasks = [];
    let projects = [];




    if (targetUser.RoleName === Roles.PROJECT_MANAGER) {

        const [projectsResult, tasksResult] = await Promise.all([


            sql.query`
                SELECT
                    p.ProjectID,
                    p.ProjectName,
                    p.Status,
                    p.ProjectDescription,
                    p.StartDate,
                    p.TargetEndDate,
                    p.ProjectManagerID,

                    pm.FullName AS ProjectManagerName

                FROM Projects p

                LEFT JOIN Users pm
                    ON p.ProjectManagerID = pm.UserID

                WHERE p.ProjectManagerID = ${id}

                ORDER BY p.ProjectID DESC
            `,



            sql.query`
                SELECT
                    t.TaskID,
                    t.ProjectID,
                    p.ProjectName,

                    t.StageID,
                    s.StageName,

                    t.DepartmentID,
                    d.DepartmentName,

                    t.TaskTitle,
                    t.TaskDescription,

                    t.AssignedTo,
                    u.FullName AS AssignedToName,

                    t.PriorityLevel,
                    t.Status,
                    t.ProgressPercent,
                    t.DueDate,
                    t.CompletedDate,
                    t.CreatedBy,
                    t.CreatedAt,
                    t.Blocker

                FROM ProjectTasks t

                INNER JOIN Projects p
                    ON t.ProjectID = p.ProjectID

                LEFT JOIN ProjectStages s
                    ON t.StageID = s.StageID

                LEFT JOIN Departments d
                    ON t.DepartmentID = d.DepartmentID

                LEFT JOIN Users u
                    ON t.AssignedTo = u.UserID

                WHERE p.ProjectManagerID = ${id}

                ORDER BY t.DueDate ASC
            `
        ]);


        projects = projectsResult.recordset;
        tasks = tasksResult.recordset;
    }


    else if (targetUser.RoleName === Roles.DEPARTMENT_MANAGER) {

        const [projectsResult, tasksResult] = await Promise.all([


            sql.query`
                SELECT DISTINCT
                    p.ProjectID,
                    p.ProjectName,
                    p.Status,
                    p.ProjectDescription,
                    p.StartDate,
                    p.TargetEndDate,
                    p.ProjectManagerID,

                    pm.FullName AS ProjectManagerName

                FROM Projects p

                INNER JOIN ProjectDepartments pd
                    ON p.ProjectID = pd.ProjectID

                LEFT JOIN Users pm
                    ON p.ProjectManagerID = pm.UserID

                WHERE pd.DepartmentID = ${targetUser.DepartmentID}

                ORDER BY p.ProjectID DESC
            `,



            sql.query`
                SELECT
                    t.TaskID,
                    t.ProjectID,
                    p.ProjectName,

                    t.StageID,
                    s.StageName,

                    t.DepartmentID,
                    d.DepartmentName,

                    t.TaskTitle,
                    t.TaskDescription,

                    t.AssignedTo,
                    u.FullName AS AssignedToName,

                    t.PriorityLevel,
                    t.Status,
                    t.ProgressPercent,
                    t.DueDate,
                    t.CompletedDate,
                    t.CreatedBy,
                    t.CreatedAt,
                    t.Blocker

                FROM ProjectTasks t

                INNER JOIN Projects p
                    ON t.ProjectID = p.ProjectID

                LEFT JOIN ProjectStages s
                    ON t.StageID = s.StageID

                LEFT JOIN Departments d
                    ON t.DepartmentID = d.DepartmentID

                LEFT JOIN Users u
                    ON t.AssignedTo = u.UserID

                WHERE t.DepartmentID = ${targetUser.DepartmentID}

                ORDER BY t.DueDate ASC
            `
        ]);


        projects = projectsResult.recordset;
        tasks = tasksResult.recordset;
    }


    else {

        const [projectsResult, tasksResult] = await Promise.all([

            sql.query`
                SELECT DISTINCT
                    p.ProjectID,
                    p.ProjectName,
                    p.Status,
                    p.ProjectDescription,
                    p.StartDate,
                    p.TargetEndDate,
                    p.ProjectManagerID,

                    pm.FullName AS ProjectManagerName

                FROM Projects p

                INNER JOIN ProjectTasks t
                    ON p.ProjectID = t.ProjectID

                LEFT JOIN Users pm
                    ON p.ProjectManagerID = pm.UserID

                WHERE t.AssignedTo = ${id}

                ORDER BY p.ProjectID DESC
            `,


            sql.query`
                SELECT
                    t.TaskID,
                    t.ProjectID,
                    p.ProjectName,

                    t.StageID,
                    s.StageName,

                    t.DepartmentID,
                    d.DepartmentName,

                    t.TaskTitle,
                    t.TaskDescription,

                    t.AssignedTo,
                    u.FullName AS AssignedToName,

                    t.PriorityLevel,
                    t.Status,
                    t.ProgressPercent,
                    t.DueDate,
                    t.CompletedDate,
                    t.CreatedBy,
                    t.CreatedAt,
                    t.Blocker

                FROM ProjectTasks t

                INNER JOIN Projects p
                    ON t.ProjectID = p.ProjectID

                LEFT JOIN ProjectStages s
                    ON t.StageID = s.StageID

                LEFT JOIN Departments d
                    ON t.DepartmentID = d.DepartmentID

                LEFT JOIN Users u
                    ON t.AssignedTo = u.UserID

                WHERE t.AssignedTo = ${id}

                ORDER BY t.DueDate ASC
            `
        ]);


        projects = projectsResult.recordset;
        tasks = tasksResult.recordset;
    }


    return {
        user: targetUser,
        projects,
        tasks
    };
};

  const updateUserPss = async (data, user) => {

    const { password, oldPassword } = data;

  
    const result = await sql.query`
        SELECT PasswordHash
        FROM Users
        WHERE UserID = ${user.UserID}
    `;

    if (result.recordset.length === 0) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const currentPasswordHash = result.recordset[0].PasswordHash;


    const isMatch = await bcrypt.compare(
        oldPassword,
        currentPasswordHash
    );

    if (!isMatch) {
        const error = new Error("Old password is incorrect");
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(
        password,
        10
    );

    await sql.query`
        UPDATE Users
        SET PasswordHash = ${hashedPassword}
        WHERE UserID = ${user.UserID}
    `;

    return {
        message: "Password updated successfully"
    };
};

const getProjectmanagers = async()=>{
    const result = await sql.query`
    SELECT u.UserID,
       u.FullName,
       u.UserName,
       u.Email,
       u.DepartmentID,
       u.BranchID,
       u.IsActive
FROM Users u
INNER JOIN UserRoles ur
ON u.UserID = ur.UserID
WHERE ur.RoleID = 3;
    `

    return result.recordset
};

const getUsersByDepartment = async (departmentId) => {

    const result = await sql.query`

        SELECT

            UserID,

            FullName,

            DepartmentID

        FROM Users

        WHERE DepartmentID = ${departmentId}

        AND IsActive = 1

    `;

    return result.recordset;

};

const getBranchAndRole = async () => {
    const [rolesResult, branchesResult] = await Promise.all([
        sql.query`
            SELECT RoleID, RoleName
            FROM Roles
        `,

        sql.query`
            SELECT BranchID, BranchName, City
            FROM Branches
        `
    ]);

    return {
        roles: rolesResult.recordset,
        branches: branchesResult.recordset
    };
};


const updateUserActiveStatus = async (targetUserId, isActive, user) => {

    if (user.RoleName !== Roles.DEPARTMENT_MANAGER ) {
        const error = new Error("Only Depratment Manager can update user active status.");
        error.statusCode = 403;
        throw error;
    }

    const targetUser = await sql.query`
        SELECT UserID, DepartmentID, IsActive
        FROM Users
        WHERE UserID = ${targetUserId}
    `;

    if (!targetUser.recordset.length) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
    }

    const target = targetUser.recordset[0];

    await sql.query`
        UPDATE Users
        SET IsActive = ${isActive}
        WHERE UserID = ${targetUserId}
    `;

    return {
        message: "User active status updated successfully.",
        userId: targetUserId,
        isActive
    };
};


module.exports = {
    getusers,
    addUser,
    updateUser,
    deleteUser,
    getuserById,
    updateUserPss,
    getProjectmanagers,
    getUsersByDepartment,
    getBranchAndRole,
    updateUserActiveStatus
};