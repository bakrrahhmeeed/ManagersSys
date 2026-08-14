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
    const result = await stageService.createStage(req.body);
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
        const result = await stageService.getStage(stageId);
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

module.exports = {
    getAllStages,
    createStage,
    updateStage,
    deleteStage,
    getStage,
    getStagesByProject
};