const projectDetailService = require("../services/projectDetailService");

const projectdetails = async (req, res , next) => {

    try {

        const result = await projectDetailService.projectdetails(req.params.id , req.user);

        res.status(200).json(result);

    } catch (err) {

        next(err);

    }

};

module.exports = {

    projectdetails

};