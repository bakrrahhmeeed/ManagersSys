const issuesService = require("../services/issuesService");

const getissues = async (req, res, next) => {
  try {
    const result = await issuesService.getissues();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getissue = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const result = await issuesService.getissue(issueId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const createissue = async (req, res, next) => {
  try {
    const result = await issuesService.createissue(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const issueData = req.body;
    const result = await issuesService.updateIssue(issueId, issueData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteIssue = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const result = await issuesService.deleteIssue(issueId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getissues,
  getissue,
  createissue,
  updateIssue,
  deleteIssue
};

