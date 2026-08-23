const express = require("express");
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");
const Roles = require("../constants/roles")

const { getdepartments , getDepartmentsByProject } = require("../controllers/DepartmentController");


router.get("/" , authorizeRoles(
    Roles.ADMIN,
    Roles.PROJECT_MANAGER
),getdepartments)

router.get("/project/:projectId", authorizeRoles(
    Roles.ADMIN,
    Roles.PROJECT_MANAGER
),getDepartmentsByProject);


module.exports = router