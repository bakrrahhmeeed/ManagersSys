const express = require("express");

const router = express.Router();

const authorizeRoles = require("../middleware/authorizeRoles");
const Roles = require("../constants/roles");

const {
    addcomment,
    addcommentonProject
} = require("../controllers/CommentController");

router.post("/",authorizeRoles(
        Roles.ADMIN,
        Roles.EMPLOYEE,
        Roles.DEPARTMENT_MANAGER,
        Roles.PROJECT_MANAGER
    ),
    addcomment
);

router.post("/project",authorizeRoles(
        Roles.ADMIN,
        Roles.PROJECT_MANAGER,
        Roles.PMO_MANAGER
    ),
    addcommentonProject
);

module.exports = router;