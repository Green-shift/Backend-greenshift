import Farmer from "../models/farmerModel.js";
import asyncHandler from "express-async-handler";
import Product from "../models/productSchema.js";
import PreListProduct from "../models/preListProductSchema.js";

// @desc    Register a new farmer
// @route   POST /api/farmers
// @access  Public
const registerFarmer = asyncHandler(async (req, res) => {
  const {
    phoneNumber,
    email,
    firstName,
    lastName,
    businessCategories,
    businessName,
    businessState,
    businessLocalGovernmentArea,
    businessAddress,
    password,
    isFarmer,
  } = req.body;

  // Validate input
  if (!email && !phoneNumber) {
    res.status(400);
    throw new Error("Please provide either email or phone number");
  }

  // Clean phone number
  let cleanedPhoneNumber;
  if (phoneNumber) {
    cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    if (cleanedPhoneNumber.length !== 11) {
      res.status(400);
      throw new Error("Phone number must be exactly 11 digits");
    }
  }

  // Clean and validate email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const cleanedEmail =
    email?.trim() === "" ? null : email?.toLowerCase().trim();
  if (cleanedEmail && !emailRegex.test(cleanedEmail)) {
    res.status(400);
    throw new Error("Invalid email address");
  }

  try {
    // Check for existing farmer
    const queryConditions = [];
    if (cleanedEmail !== null && cleanedEmail !== "") {
      queryConditions.push({ email: cleanedEmail });
    }
    if (cleanedPhoneNumber) {
      queryConditions.push({ phoneNumber: cleanedPhoneNumber.toString() });
    }

    const existingFarmer = await Farmer.findOne({
      $or: queryConditions,
    });

    if (existingFarmer) {
      res.status(409).json({
        message: "Farmer already exists with this email or phone number",
      });
    } else {
      // Create new Farmer
      const newFarmer = {
        firstName,
        lastName,
        phoneNumber: cleanedPhoneNumber,
        businessCategories: Array.isArray(businessCategories)
          ? businessCategories.map((category) => category.trim())
          : [businessCategories.toString().trim()],
        businessName,
        businessState,
        businessLocalGovernmentArea,
        businessAddress,
        password,
        isFarmer,
      };
      if (cleanedEmail !== null) {
        newFarmer.email = cleanedEmail;
      }

      const farmer = await Farmer.create(newFarmer);

      // Respond with farmer details
      if (farmer) {
        res.status(201).json({
          _id: farmer._id,
          firstName: farmer.firstName,
          lastName: farmer.lastName,
          phoneNumber: farmer.phoneNumber,
          email: farmer.email,
          businessName: farmer.businessName,
          businessCategories: farmer.businessCategories,
          businessState: farmer.businessState,
          businessLocalGovernmentArea: farmer.businessLocalGovernmentArea,
          businessAddress: farmer.businessAddress,
          isFarmer: farmer.isFarmer,
        });
      } else {
        res.status(500).json({ message: "Failed to create farmer" });
      }
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while registering farmer" });
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

// @desc    Update a product
// @route   PUT /api/farmers/products/:id
// @access  Private (Farmer only)
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
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

  // Find the product
  const product = await Product.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if the current farmer owns the product
  if (!product.farmer.equals(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to update this product");
  }

  // Update product details
  product.produceName = produceName || product.produceName;
  product.category = category || product.category;
  product.quantity = quantity || product.quantity;
  product.location = location || product.location;
  product.price = price || product.price;
  product.bulkPrice = bulkPrice || product.bulkPrice;
  product.description = description || product.description;
  product.imagePath = req.file
    ? `/uploads/${req.file.filename}`
    : product.imagePath;

  const updatedProduct = await product.save();

  res.status(200).json({
    _id: updatedProduct._id,
    produceName: updatedProduct.produceName,
    category: updatedProduct.category,
    quantity: updatedProduct.quantity,
    location: updatedProduct.location,
    price: updatedProduct.price,
    bulkPrice: updatedProduct.bulkPrice,
    description: updatedProduct.description,
    imagePath: updatedProduct.imagePath,
    farmer: updatedProduct.farmer,
  });
});

// @desc    Delete a product
// @route   DELETE /api/farmers/products/:id
// @access  Private (Farmer only)
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const farmer = await Farmer.findById(req.user._id);

  if (!farmer) {
    res.status(401);
    throw new Error("Farmer not authorized");
  }

  // Find the product
  const product = await Product.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if the current farmer owns the product
  if (!product.farmer.equals(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to delete this product");
  }

  // Use deleteOne() to remove the product
  await Product.deleteOne({ _id: id });

  res.status(200).json({ message: "Product removed" });
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

// @desc    Pre-list a new product
// @route   POST /api/products/prelist
// @access  Private (Farmer only)
const preListProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    stock,
    startHarvestDate,
    endHarvestDate,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !description ||
    !price ||
    !category ||
    !startHarvestDate ||
    !endHarvestDate
  ) {
    res.status(400);
    throw new Error(
      "Please provide all required fields: name, description, price, category, startHarvestDate, endHarvestDate"
    );
  }

  // Additional checks
  if (price < 0) {
    res.status(400);
    throw new Error("Price cannot be negative");
  }
  if (stock < 0) {
    res.status(400);
    throw new Error("Stock cannot be negative");
  }
  if (new Date(startHarvestDate) > new Date(endHarvestDate)) {
    res.status(400);
    throw new Error("Start date cannot be after end date");
  }

  // Create the prelisted product
  const preListedProduct = new PreListProduct({
    name,
    description,
    price,
    category,
    stock,
    startHarvestDate,
    endHarvestDate,
    createdBy: req.user._id,
  });

  const createdProduct = await preListedProduct.save();

  res.status(201).json({
    message: "Product pre-listed successfully",
    product: createdProduct,
  });
});

// @desc Get all prelisted products by the logged-in farmer
// @route GET /api/products/prelist
// @access Private (Farmers only)
const getFarmerPrelistedProducts = asyncHandler(async (req, res) => {
  const products = await PreListProduct.find({ createdBy: req.user._id });

  res.status(200).json(products);
});

// @desc Delete a prelisted product by the logged-in farmer
// @route DELETE /api/products/prelist/:id
// @access Private (Farmers only)
const deletePrelistedProduct = asyncHandler(async (req, res) => {
  const product = await PreListProduct.findById(req.params.id);

  // Check if product exists and belongs to the farmer
  if (!product || product.createdBy.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error("Product not found or unauthorized");
  }

  await product.deleteOne();

  res.status(200).json({ message: "Product deleted successfully" });
});

export {
  registerFarmer,
  postProduct,
  getAllProducts,
  getFarmerProducts,
  updateProduct,
  deleteProduct,
  preListProduct,
  getFarmerPrelistedProducts,
  deletePrelistedProduct,
};
