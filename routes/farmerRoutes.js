import express from 'express'
import {
    getAllProducts,
    getFarmerProducts,
    postProduct,
    registerFarmer
} from '../controllers/farmerControllers.js'
import { farmerOnly, protect } from '../middleware/authMiddleware.js'

const router = express.Router()
router.post('/', registerFarmer)
router.post('/products', protect, farmerOnly, postProduct)
router.get('/products', protect, getAllProducts)
router.get('/farmerProducts', protect, farmerOnly, getFarmerProducts);

export default router