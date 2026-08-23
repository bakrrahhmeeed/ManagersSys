const express = require("express");
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles")
const createProjectValidation = require("../middleware/createProjectValidation");
const updateProjectValidation = require("../middleware/updateProjectValidation")
const Roles = require("../constants/roles")



const {
    getprojects,
    createproject,
    updateProject,
    deleteProject,
    getprojectsById,
} = require("../controllers/projectController");




router.get   ("/",getprojects);
router.get   ("/:id",getprojectsById);
router.post  ("/",authorizeRoles(
    Roles.ADMIN,
    Roles.PMO_MANAGER,
    Roles.SECRETARY
),createProjectValidation,createproject);
router.put   ("/:id",authorizeRoles(
    Roles.ADMIN,
    Roles.PMO_MANAGER
),updateProjectValidation, updateProject);
router.delete("/:id",authorizeRoles(
    Roles.ADMIN
), deleteProject);

module.exports = router;