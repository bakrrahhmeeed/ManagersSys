const sql = require("mssql");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")

const login = async (data) => {
    const { userName, password } = data;

    const result = await sql.query`
        SELECT
          u.UserID,
          u.FullName,
          u.UserName,
          u.Email,
          u.PasswordHash,
          u.IsActive,
          u.DepartmentID,
          ur.RoleID,
          r.RoleName
        FROM Users u
        JOIN UserRoles ur
          ON u.UserID = ur.UserID
        JOIN Roles r
          ON ur.RoleID = r.RoleID
        WHERE u.UserName = ${userName};
`

    const user = result.recordset[0];

    if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
    throw new Error('Invalid username or password');
    }
    if (!user.IsActive) {
    throw new Error("Your account has been deactivated. Please contact the administrator.");
}


    const token = jwt.sign(
      {
        id:user.UserID,
        userName:user.UserName,
        roleId: user.RoleID,
        roleName: user.RoleName,
        departmentID:user.DepartmentID
      },
        process.env.JWT_SECRET,
      {
        expiresIn:"1d"
      });
    
    
    
    return {
  message: "Login Success",
  token,
  user: {
    id: user.UserID,
    fullName: user.FullName,
    userName: user.UserName,
    email: user.Email,
    roleId: user.RoleID,
    roleName: user.RoleName,
  },
};
};

module.exports = {
    login
};
