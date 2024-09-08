import  express  from "express";
import { 
    authUserOrFarmer,     
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile 
} from "../controllers/userControllers.js";

import { protect, userOnly } from "../middleware/authMiddleware.js";

const router = express.Router()

router.post("/", registerUser)
router.post("/auth", authUserOrFarmer)
router.post("/logout", logoutUser)

router.route('/profile').get(protect,userOnly,getUserProfile).put(protect,userOnly,updateUserProfile)

export default router