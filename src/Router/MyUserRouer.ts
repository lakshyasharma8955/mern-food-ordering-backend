import express from "express";
const router = express.Router();
import MyUserController from "../Controller/MyUserController";
import { jwtCheck,verifyToken } from "../Middleware/middleware";

router.post("/create-user",jwtCheck, MyUserController.createUser);
router.post("/update-user",jwtCheck,verifyToken, MyUserController.updateUser);
router.post("/get-user",jwtCheck,verifyToken,MyUserController.getUser)
export default router;