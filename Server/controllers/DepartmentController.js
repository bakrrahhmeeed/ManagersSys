const departmentservice = require("../services/DepartmentService")


const getdepartments = async(req , res , next )=>{
    try{
        const result = await departmentservice.getdepartments();
        res.status(200).json(result);
    }
    catch(err){
        next(err);
    }
}

const getDepartmentsByProject = async (req, res) => {

    try {
        const { projectId } = req.params;
        const departments =
            await departmentservice.getDepartmentsByProject(projectId);
        res.json({
            departments
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message
        });
    }
};

module.exports ={
    getdepartments,
    getDepartmentsByProject
}