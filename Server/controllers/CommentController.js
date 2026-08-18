const  CommentService = require("../services/CommentService")


const addcomment = async(req , res , next)=>{
    try{
        const result = await CommentService.addcomment(req.user , req.params.is , req.body)
        res.status(200).json(result);
    }
    catch(err){
        next(err)
    }
    

}

module.exports = {
    addcomment
}