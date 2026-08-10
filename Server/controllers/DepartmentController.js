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

module.exports ={
    getdepartments
}