import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllProducts,
  getFarmerProducts,
  postProduct,
  registerFarmer,
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
router.post("/", registerFarmer);
router.post(
  "/products",
  protect,
  farmerOnly,
  upload.single("image"),
  postProduct
);
router.get("/products", protect, getAllProducts);
router.get("/farmerProducts", protect, farmerOnly, getFarmerProducts);

export default router;
