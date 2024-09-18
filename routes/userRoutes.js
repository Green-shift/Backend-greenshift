import  express  from "express";
import { 
    authUserOrFarmer,     
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile, 
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getAllApprovedPrelistedProducts
} from "../controllers/userControllers.js";

import { protect, userOnly } from "../middleware/authMiddleware.js";

const router = express.Router()

// auth
router.post("/", registerUser)
router.post("/auth", authUserOrFarmer)
router.post("/logout", logoutUser)

// cart
router.post('/cart', protect, userOnly, addToCart)
router.get('/cart', protect, userOnly, getCart);
router.put('/cart', protect, userOnly, updateCartItem)
router.delete('/cart/remove/:productId', protect, userOnly, removeCartItem)
router.delete('/cart/clear', protect, userOnly, clearCart);

// profile
router.route('/profile').get(protect,userOnly,getUserProfile).put(protect,userOnly,updateUserProfile)

// prelisted products
router.get('/prelist/all', protect, getAllApprovedPrelistedProducts)

export default router