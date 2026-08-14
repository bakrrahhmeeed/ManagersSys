const express = require('express');
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");



const {getAllStages,
    createStage,
    updateStage,
    deleteStage,
    getStage,
    getStagesByProject
} = require('../controllers/stageController');



router.get('/', authorizeRoles("Administrator"), getAllStages);
router.post('/', authorizeRoles("Administrator"), createStage);
router.put('/:id', authorizeRoles("Administrator"), updateStage);
router.delete('/:id', authorizeRoles("Administrator"), deleteStage);
router.get('/:id',authorizeRoles("Administrator"), getStage);
router.get("/project/:projectId",authorizeRoles("Administrator"),getStagesByProject);


module.exports = router;