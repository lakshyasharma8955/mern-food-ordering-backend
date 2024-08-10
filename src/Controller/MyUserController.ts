import userModel from "../Model/user";
import Validator from "validatorjs";
import { Request, Response } from "express";
import { error } from "console";

// Create User Validation

const userCreateValidation = 
{
  auth0Id : 'required|string',
  email : 'required|string',
  name :  'string',
  addressLine1 : 'string',
  city : 'string',
  country : 'string'
}

// Create User APi

const createUser = async(req:Request, res:Response) =>
  {
    const request = req.body;
    try {
      const validation = new Validator(request,userCreateValidation);
      if(!validation.passes())
        {
          return res.json({
            code:400,
            message:"Invalid Validation",
            errors: validation.errors.all()
          });
        }
        const {auth0Id} = request;
        const existingUser = await userModel.findOne({auth0Id});
        if(existingUser)
          {
            return res.json({code:409,message:"auth0Id alreay exists"});
          }
          const newUser = new userModel(request);
          newUser.save();
          return res.json({code:200,message:newUser.toObject()});
    } catch (error: any) {
        console.error("An error occurred:", error.message);
        return res.status(500).json({
            code: 500,
            message: "An error occurred during user creation",
            error: error.message
        });
    }
  }



   // Update User Validation
  
   const updateUserValidation = 
   {
     name : 'required|string',
     addressLine1 : 'required|string',
     city : 'required|string',
     country : 'required|string'
   }
 
 const updateUser = async(req:Request, res:Response) =>
   {
      const request = req.body;
      try {
       const validation = new Validator(request,updateUserValidation);
       if(!validation.passes())
         {
           return res.json
           ({
             code:400,
             message:'Invalid Validation',
             errors:validation.errors.all()
           })
         }
          const {name,addressLine1,city,country} = request;
          const user = await userModel.findById(req.userId);
          if(!user)
           {
             return res.json
             ({
               code : 404,
               message : "User not found"
             })
           }
           user.name = name;
           user.addressLine1 = addressLine1;
           user.city = city;
           user.country = country;
           await user.save();
           return res.json
           ({
             code: 200,
             message: user
           })
        
      } catch (error:any)  {
       console.error("An error occurred:", error.message);
       return res.status(500).json({
           code: 500,
           message: "An error occurred during user updation",
           error: error.message
       });
   }
      }
        
      const getUser = async(req:Request,res:Response) =>
        {
           try {
            const user = await userModel.findOne({_id:req.userId});
            if(!user)
              {
                return res.json
                ({
                  code:404,
                  message:"User not found"
                })
              }
                   res.json(user)
           } catch (error:any){
            console.error("An error occurred:", error.message);
            return res.status(500).json({
                code: 500,
                message: "An error occurred during user updation",
                error: error.message
            });
        }

        }

        
             
   export default 
   {
    createUser,
    updateUser,
    getUser
   }