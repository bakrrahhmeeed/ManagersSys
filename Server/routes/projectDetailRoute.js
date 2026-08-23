const express = require("express");
const router = express.Router();
const Roles = require("../constants/roles")
const authorizeRoles = require("../middleware/authorizeRoles");

const { projectdetails } = require("../controllers/projectDetailcontrol");

router.get("/project/:id/details",authorizeRoles
    (Roles.ADMIN,
        Roles.PROJECT_MANAGER,
        Roles.DEPARTMENT_MANAGER,
        Roles.SECRETARY,
        Roles.PMO_MANAGER
    ),projectdetails);

module.exports = router;