const express = require("express");
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");
const Roles = require("../constants/roles")

const { getdepartments } = require("../controllers/DepartmentController");


router.get("/" , authorizeRoles(
    Roles.ADMIN,
    Roles.DEPARTMENT_MANAGER,
    Roles.SECRETARY
),getdepartments)


module.exports = router