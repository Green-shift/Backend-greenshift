import Farmer from "../models/farmerModel.js";
import asyncHandler from "express-async-handler";
import Product from "../models/productSchema.js";

// @desc    Register a new farmer
// @route   POST /api/farmers
// @access  Public
const registerFarmer = asyncHandler(async (req, res) => {
  const {
    phoneNumber,
    email,
    businessCategories,
    businessState,
    businessLocalGovernmentArea,
    businessAddress,
    password,
    isFarmer,
  } = req.body;

  // Checking if farmer exists
  const farmerExists = await Farmer.findOne({ email });
  if (farmerExists) {
    res.status(400);
    throw new Error("Farmer already exists");
  }

  // Creating new farmer
  const farmer = await Farmer.create({
    phoneNumber,
    email,
    businessCategories,
    businessState,
    businessLocalGovernmentArea,
    businessAddress,
    password,
    isFarmer,
  });

  // If farmer creation is successful
  if (farmer) {
    res.status(201).json({
      _id: farmer._id,
      phoneNumber: farmer.phoneNumber,
      email: farmer.email,
      businessCategories: farmer.businessCategories,
      businessState: farmer.businessState,
      businessLocalGovernmentArea: farmer.businessLocalGovernmentArea,
      businessAddress: farmer.businessAddress,
      isFarmer: farmer.isFarmer,
    });
  } else {
    res.status(400);
    throw new Error("Invalid farmer data");
  }
});

// @desc    Post a new product by a farmer
// @route   POST /api/farmers/products
// @access  Private (Farmer only)
const postProduct = asyncHandler(async (req, res) => {
  const {
    produceName,
    category,
    quantity,
    location,
    price,
    bulkPrice,
    description,
  } = req.body;

  const farmer = await Farmer.findById(req.user._id);

  if (!farmer) {
    res.status(401);
    throw new Error("Farmer not authorized");
  }

  // Create new product
  const product = await Product.create({
    farmer: req.user._id,
    produceName,
    category,
    quantity,
    location,
    price,
    bulkPrice,
    description,
    imagePath: req.file ? `/uploads/${req.file.filename}` : null,
  });

  if (product) {
    res.status(201).json({
      _id: product._id,
      produceName: product.produceName,
      category: product.category,
      quantity: product.quantity,
      location: product.location,
      price: product.price,
      bulkPrice: product.bulkPrice,
      description: product.description,
      imagePath: product.imagePath,
      farmer: product.farmer,
    });
  } else {
    res.status(400);
    throw new Error("Invalid product data");
  }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).select(
    "produceName category location quantity price bulkPrice imagePath"
  );

  if (products.length > 0) {
    res.status(200).json(products);
  } else {
    res.status(404);
    throw new Error("No products found");
  }
});

// @desc    Get products posted by a particular farmer
// @route   GET /api/farmers/products
// @access  Private (Farmer only)
const getFarmerProducts = asyncHandler(async (req, res) => {
  const farmer = await Farmer.findById(req.user._id);

  if (!farmer) {
    res.status(401);
    throw new Error("Farmer not authorized");
  }

  const products = await Product.find({ farmer: req.user._id }).select(
    "produceName category location quantity price bulkPrice imagePath"
  );

  if (products.length > 0) {
    res.status(200).json(products);
  } else {
    res.status(404);
    throw new Error("No products found for this farmer");
  }
});

export { registerFarmer, postProduct, getAllProducts, getFarmerProducts };
