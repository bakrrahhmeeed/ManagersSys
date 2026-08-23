const stageService = require('../services/stageService');

const getAllStages = async (req, res, next) => {
  try {
    const result = await stageService.getAllStages();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const createStage = async (req, res, next) => {
  try {
    const result = await stageService.createStage(req.user,req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

const updateStage = async (req, res, next) => {
  try {
    const result = await stageService.updateStage(req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteStage = async (req, res, next) => {
  try {
    const result = await stageService.deleteStage(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getStage = async (req, res, next) => {
    try {
        const stageId = req.params.id;
        const result = await stageService.getStage(stageId , req.user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getStagesByProject = async(req , res , next) =>{
   try {
    const result = await stageService.getStagesByProject(req.params.projectId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

const getProjectsWithStages = async(req , res , next)=>{
  try{
    const result = await stageService.getProjectsWithStages(req.user);
    res.status(200).json(result);
  }
  catch(err){
    next(err);
  }
}

const getDepartmentManger= async (req, res, next) => {
    try {
        const result = await stageService.getDepartmentManger(req.params.departmentId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllStages,
    createStage,
    updateStage,
    deleteStage,
    getStage,
    getStagesByProject,
    getProjectsWithStages, 
    getDepartmentManger
};