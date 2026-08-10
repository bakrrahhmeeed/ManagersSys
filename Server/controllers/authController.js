const authService = require("../services/authService");

const login = async (req, res , next) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
module.exports = {
    login,
};
