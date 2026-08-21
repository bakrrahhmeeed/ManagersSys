const express = require('express');
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");
const Roles = require("../constants/roles")



const {getAllStages,
    createStage,
    updateStage,
    deleteStage,
    getStage,
    getStagesByProject,
    getProjectsWithStages,
    getDepartmentManger
} = require('../controllers/stageController');



router.get("/projectwithstages" , authorizeRoles(
    Roles.ADMIN,
    Roles.PROJECT_MANAGER,
    Roles.PMO_MANAGER,
    Roles.DEPARTMENT_MANAGER
) , getProjectsWithStages)

router.get("/departmentmanagers/:departmentId", authorizeRoles
    (Roles.ADMIN , Roles.PROJECT_MANAGER , Roles.PMO_MANAGER),
    getDepartmentManger
)

router.get('/', authorizeRoles("Administrator"), getAllStages);
router.post('/', authorizeRoles("Administrator"), createStage);
router.put('/:id', authorizeRoles("Administrator"), updateStage);
router.delete('/:id', authorizeRoles("Administrator"), deleteStage);
router.get('/:id',authorizeRoles("Administrator"), getStage);
router.get("/project/:projectId",authorizeRoles("Administrator"),getStagesByProject);



module.exports = router;