const express = require('express');
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");


const {getAllTasks,
    createTask,
    updateTask,
    deleteTask,
    getTask
} = require('../controllers/tasksController');



router.get('/',authorizeRoles("Administrator"), getAllTasks);
router.post('/',authorizeRoles("Administrator"), createTask);
router.put('/:taskId',authorizeRoles("Administrator"), updateTask);
router.delete('/:taskId', authorizeRoles('Administrator'), deleteTask);
router.get('/:taskId', authorizeRoles('Administrator'), getTask);




module.exports = router;