const ObjectivesService = require("../services/objectivesService");

const getObjectives = async (req, res, next) => {
  try {
    const result = await ObjectivesService.getObjectives();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getObjective = async (req, res, next) => {
  try {
    const result = await ObjectivesService.getObjective(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createObjective = async (req, res, next) => {
  try {
    const result = await ObjectivesService.createObjective(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getObjectives,
  getObjective,
  createObjective
};