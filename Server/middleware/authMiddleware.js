const jwt = require("jsonwebtoken");
const sql = require("mssql");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await sql.query`
      SELECT
          u.UserID,
          u.FullName,
          u.UserName,
          u.Email,
          u.DepartmentID,
          u.BranchID,
          u.IsActive,
          ur.RoleID,
          r.RoleName AS RoleName
      FROM Users u
      JOIN UserRoles ur
          ON u.UserID = ur.UserID
      JOIN Roles r
          ON ur.RoleID = r.RoleID
      WHERE u.UserID = ${decoded.id}
    `;

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    if (!user.IsActive) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact the administrator.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authMiddleware;