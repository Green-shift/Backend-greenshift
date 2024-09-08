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
        isFarmer
    } = req.body;

    // Checking if farmer exists
    const farmerExists = await Farmer.findOne({ email });
    if (farmerExists) {
        res.status(400);
        throw new Error('Farmer already exists');
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
        isFarmer
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
            isFarmer: farmer.isFarmer
        });
    } else {
        res.status(400);
        throw new Error('Invalid farmer data');
    }
});


// @desc    Post a new product by a farmer
// @route   POST /api/farmers/products
// @access  Private (Farmer only)
const postProduct = asyncHandler(async (req, res) => {
    const { produceType, category, quantity, location, bidPrice, bidPeriod } = req.body;

    const farmer = await Farmer.findById(req.user._id);
    
    if (!farmer) {
        res.status(401);
        throw new Error('Farmer not authorized');
    }

    // Convert bidPeriod (e.g., '7 days') to a Date
    let bidEndDate;
    if (typeof bidPeriod === 'string') {
        const [value, unit] = bidPeriod.split(' ');
        bidEndDate = new Date();
        if (unit === 'days') {
            bidEndDate.setDate(bidEndDate.getDate() + parseInt(value));
            // return;
        } 
    }

    // Create new product
    const product = await Product.create({
        farmer: req.user._id, 
        produceType,
        category,
        quantity,
        location,
        bidPrice,
        bidPeriod: bidEndDate,
    });

    if (product) {
        res.status(201).json({
            _id: product._id,
            produceType: product.produceType,
            category: product.category,
            quantity: product.quantity,
            location: product.location,
            bidPrice: product.bidPrice,
            bidPeriod: product.bidPeriod,
            farmer: product.farmer,
        });
    } else {
        res.status(400);
        throw new Error('Invalid product data');
    }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).select('produceType location quantity bidPrice bidPeriod');

    if (products.length > 0) {
        res.status(200).json(products);
    } else {
        res.status(404);
        throw new Error('No products found');
    }
});

// @desc    Get products posted by a particular farmer
// @route   GET /api/farmers/products
// @access  Private (Farmer only)
const getFarmerProducts = asyncHandler(async (req, res) => {
    const farmer = await Farmer.findById(req.user._id);

    if (!farmer) {
        res.status(401);
        throw new Error('Farmer not authorized');
    }

    const products = await Product.find({ farmer: req.user._id }).select('produceType location quantity bidPrice bidPeriod');

    if (products.length > 0) {
        res.status(200).json(products);
    } else {
        res.status(404);
        throw new Error('No products found for this farmer');
    }
});



export{
    registerFarmer,
    postProduct,
    getAllProducts,
    getFarmerProducts
}