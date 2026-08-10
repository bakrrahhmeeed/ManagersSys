const risksService = require('../services/risksService');

const getAllRisks = async (req, res, next) => {
  try {
    const result = await risksService.getAllRisks();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRisk = async (req, res, next) => {
  try {
    const result = await risksService.getRisk(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Risk not found' });
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createRisk = async (req, res, next) => {
  try {
    const result = await risksService.createRisk(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updateRisk = async (req, res, next) => {
  try {
    const result = await risksService.updateRisk(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ message: 'Risk not found' });
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteRisk = async (req, res, next) => {
  try {
    const result = await risksService.deleteRisk(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Risk not found' });
    }
    res.status(200).json({ message: 'Risk deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRisks,
    getRisk,
    createRisk,
    updateRisk,
    deleteRisk
};
 