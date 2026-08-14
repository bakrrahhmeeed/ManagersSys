const TasksService = require("../services/TasksService");

const getAllTasks = async (req, res, next) => {
  try {
    const result = await TasksService.getAllTasks();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const result = await TasksService.createTask(req.body ,req.user.userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const result = await TasksService.updateTask(req.params.taskId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const result = await TasksService.deleteTask(req.params.taskId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};  

const getTask = async (req, res, next) =>  {
    try {
        const taskId = req.params.taskId;
        const result = await TasksService.getTask(taskId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }   
}

module.exports = {
  getAllTasks,
    createTask,
    updateTask,
    deleteTask,
    getTask
};