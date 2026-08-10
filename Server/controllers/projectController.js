const projectService = require("../services/projectService")

const getprojects = async (req , res , next) =>{
    try{
        const result = await projectService.getprojects(req.user);
        res.status(200).json(result);

    }catch (error){
        next(error);
        
    }
};

const getprojectsById = async (req , res , next) =>{
    try{
        const result = await projectService.getprojectsById(req.params.id , req.user);
        res.status(200).json(result);

    }catch (error){
        next(error);
    }
};

const createproject = async (req , res , next) =>{
    try{
        const result = await projectService.createproject(req.body , req.user.UserID);
        res.status(201).json(result);

    }catch (error){
        next(error);
        
    }
};

const updateProject = async (req , res , next) =>{
    try{
        const result = await projectService.updateProject(req.params.id , req.body);
        res.status(200).json(result);

    }catch (error){
        next(error);
    }
};

const deleteProject = async(req,res , next)=>{
    try{
        const result = await projectService.deleteProject(req.params.id);
        res.status(200).json(result);
    }catch(err){
        next(err);
    }
}



module.exports = {
    getprojects,
    createproject,
    updateProject,
    deleteProject,
    getprojectsById
}

