const express = require('express');
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");
const Roles = require("../constants/roles")


const {getAllTasks,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    updateTaskEmbloyee
} = require('../controllers/tasksController');



router.get('/', getAllTasks);
router.post('/',authorizeRoles(Roles.ADMIN , Roles.PROJECT_MANAGER , Roles.DEPARTMENT_MANAGER), createTask);
router.put('/:taskId',authorizeRoles(Roles.ADMIN ,Roles.DEPARTMENT_MANAGER , Roles.PROJECT_MANAGER), updateTask);
router.put('/employee/:taskid' , authorizeRoles(Roles.EMPLOYEE) , updateTaskEmbloyee)
router.delete('/:taskId', authorizeRoles(Roles.ADMIN), deleteTask);
router.get('/:taskId', getTask);




module.exports = router;