import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllProducts,
  getFarmerProducts,
  postProduct,
  registerFarmer,
  updateProduct,
  deleteProduct,
  preListProduct,
  getFarmerPrelistedProducts,
  deletePrelistedProduct,
} from "../controllers/farmerControllers.js";
import { farmerOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Register a new farmer
router.post("/", registerFarmer);

// Post a new product
router.post(
  "/products",
  protect,
  farmerOnly,
  upload.single("image"),
  postProduct
);

// Get all products
router.get("/products", getAllProducts);

// Get products posted by a particular farmer
router.get("/farmerProducts", protect, farmerOnly, getFarmerProducts);

// Update a product
router.put(
  "/products/:id",
  protect,
  farmerOnly,
  upload.single("image"),
  updateProduct
);

// Delete a product
router.delete("/products/:id", protect, farmerOnly, deleteProduct);

// Prelist a product
router.route('/prelist')
  .post(protect, farmerOnly, preListProduct)
  .get(protect, farmerOnly, getFarmerPrelistedProducts);

// Routes to Delete specific products
router.route('/prelist/:id')
  .delete(protect, farmerOnly, deletePrelistedProduct);
export default router;
