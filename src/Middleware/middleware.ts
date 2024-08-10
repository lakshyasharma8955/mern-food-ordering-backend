import {Request,Response,NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import jwt from "jsonwebtoken";
import userModel from "../Model/user";

// Globaly use userId and auth0Id

  declare global
  {
    namespace Express
    {
      interface Request
      {
        userId: string,
        auth0Id: string,
      }
    }
  }




// Check Token

export const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGNING_ALG
  });




// Verify By Token

export const verifyToken = async(req:Request,res:Response,next:NextFunction) =>
  {
    const Authorization = req.headers["authorization"];
    if(!Authorization)
      {
        return res.json
        ({
          code :401,
          message:"Please Provide a token in header"
        })
      }
      const token = Authorization.split(" ")[1]; 
   
      try {
         const decode = jwt.decode(token) as jwt.JwtPayload;
         if (!decode || !decode.sub) {
          return res.json({
            code: 401,
            message: "Invalid token"
          });
        }
         const auth0Id = decode.sub;
         const user = await userModel.findOne({auth0Id});
         if(!user)
          {
            return res.json
            ({
              code:401,
              message:"User not found"
            })
          }
           req.auth0Id = auth0Id as string;
           req.userId = user._id.toString();
           next();
      } catch (error:any)  {
        return res.json({
          code: 500,
          message: "Token verification failed",
          error: error.message
        });
      }
  }


