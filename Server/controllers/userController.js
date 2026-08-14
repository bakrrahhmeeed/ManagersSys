const userService = require("../services/userService")


  const getuser = async (req,res , next) =>{
  try{
      const result = await userService.getusers(req.user);
      res.status(200).json(result);
  }
  catch(err){
    next(err);
  }
    
  }

  const addUser = async(req , res , next)=>{
    try{
      const result = await userService.addUser(req.body);
      res.status(201).json(result);
    }catch(err){
      next(err);
    }
  }

  const updateUser = async(req,res , next)=>{
    try{
      const result = await userService.updateUser(req.params.id , req.body)
      res.status(200).json(result)

    }catch(err){
      next(err);
    }
    
  }

  const deleteUser = async(req ,res , next) =>{
    try{
      const result = await userService.deleteUser(req.params.id)
      res.status(200).json(result)
    }catch(err){
      next(err);
    }
  }

  const getuserById = async(req,res , next)=>{
    try{
      const result = await userService.getuserById(req.params.id , req.user);
      res.status(200).json(result);
    }
    catch(err){
      next(err);
    }
    

  }

  const updateUserPss = async(req,res , next)=>{
    try{
      const result = await userService.updateUserPss(req.body , req.user)
      res.status(200).json(result)
    }catch(err){
      next(err);
    }
  }

  const getProjectmanagers = async(req, res , next)=>{
    try{
      const result = await userService.getProjectmanagers()
      res.status(200).json(result)
    }catch(err){
      next(err);
    }
  }




const getUsersByDepartment = async (req, res, next) => {

    try {

        const users = await userService.getUsersByDepartment(

            req.params.departmentId

        );

        res.status(200).json(users);

    } catch (err) {

        next(err);

    }

};


  module.exports = {
    getuser,
    addUser,
    updateUser,
    deleteUser,
    getuserById,
    updateUserPss,
    getProjectmanagers,
    getUsersByDepartment
  };
