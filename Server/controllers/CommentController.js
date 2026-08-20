const CommentService = require("../services/CommentService");

const addcomment = async (req, res, next) => {
    try {
        const result = await CommentService.addcomment(req.user,req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

const addcommentonProject = async (req, res, next) => {
    try {
        const result = await CommentService.addcommentonProject(req.user,req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    addcomment,
    addcommentonProject
};