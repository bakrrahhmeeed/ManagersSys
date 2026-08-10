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
        UserID,
        FullName,
        UserName,
        Email,
        IsActive,
        DepartmentID,
        BranchID
        FROM dbo.Users;
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
}

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

  const deleteUser = async(id)=>{
    const result = await sql.query`
      DELETE FROM Users
      WHERE UserID = ${id};
    `

    return {
      message:"usere deleted"
    }
  };

  const getuserById = async(id , user)=>{

    const check = await sql.query`
    SELECT DEPARTMENTID FROM USERS WHERE USERID = ${id}
    `
    const departmentid =  check.recordset[0].DepartmentID

    if(user.RoleName === Roles.DEPARTMENT_MANAGER && user.DepartmentID ===  departmentid ){
     const result = await sql.query`
      select 
        UserID ,
        FullName,
        UserName,
        Email,
        DepartmentID,
        BranchID,
        IsActive,
        CreatedAt
      from users 
      WHERE USERID =${id};
    `

    return result.recordset[0]


    }else{
     const result = await sql.query`
      select 
        UserID ,
        FullName,
        UserName,
        Email,
        DepartmentID,
        BranchID,
        IsActive,
        CreatedAt
      from users 
      WHERE USERID =${id};
    `

    return result.recordset[0]
  }; }


  const updateUserPss = async( data , user)=>{
   
    const {password} = data;
  
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await sql.query`

        UPDATE Users
        SET PasswordHash = ${hashedPassword}
        WHERE UserID = ${user.UserID};

    `;

    return{
      message:"password udpated"
    }
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
  }

  module.exports = {
    getusers,
    addUser,
    updateUser,
    deleteUser,
    getuserById,
    updateUserPss,
    getProjectmanagers
  };