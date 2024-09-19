import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import Farmer from "../models/farmerModel.js";
import Cart from "../models/cart.js";
import Product from "../models/productSchema.js";
import PreListProduct from "../models/preListProductSchema.js";

// @desc    Auth user or farmer / set token
// @route   POST /api/auth
// @access  Public
const authUserOrFarmer = asyncHandler(async (req, res) => {
  const { credential, password } = req.body;

  // Check if credential and password are provided
  if (!credential || !password) {
    res.status(400);
    throw new Error(
      "Please provide both credential (email/phone) and password"
    );
  }

  // Check if the credential is an email or phone number
  const isEmail = credential.includes("@");

  // If the credential is an email, convert it to lowercase
  const normalizedCredential = isEmail ? credential.toLowerCase() : credential;

  // Search by email if it's an email, otherwise search by phone number
  const user = isEmail
    ? await User.findOne({ email: normalizedCredential })
    : await User.findOne({ phoneNumber: credential });

  if (user && (await user.matchPassword(password))) {
    // If user found and password matches
    const token = generateToken(user._id);
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isFarmer: user.isFarmer,
      token,
    });
  } else {
    // Check in Farmer collection if not found in User collection
    const farmer = isEmail
      ? await Farmer.findOne({ email: normalizedCredential })
      : await Farmer.findOne({ phoneNumber: credential });

    if (farmer && (await farmer.matchPassword(password))) {
      const token = generateToken(farmer._id);
      res.status(200).json({
        _id: farmer._id,
        email: farmer.email,
        phoneNumber: farmer.phoneNumber,
        businessCategories: farmer.businessCategories,
        businessState: farmer.businessState,
        businessLocalGovernmentArea: farmer.businessLocalGovernmentArea,
        businessAddress: farmer.businessAddress,
        isFarmer: true,
        token,
      });
    } else {
      res.status(401);
      throw new Error("Invalid email/phone number or password");
    }
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password, isFarmer } =
    req.body;

  // Validate input
  if (!email && !phoneNumber) {
    res.status(400);
    throw new Error("Please provide either an email or a phone number");
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
    // Check for existing user
    const queryConditions = [];
    if (cleanedEmail !== null && cleanedEmail !== "") {
      queryConditions.push({ email: cleanedEmail });
    }
    if (cleanedPhoneNumber) {
      queryConditions.push({ phoneNumber: cleanedPhoneNumber.toString() });
    }

    const existingUser = await User.findOne({
      $or: queryConditions,
    });

    if (existingUser) {
      res.status(409).json({
        message: "User already exists with this email or phone number",
      });
    } else {
      // Create new user
      const newUser = {
        firstName,
        lastName,
        phoneNumber: cleanedPhoneNumber,
        password,
        isFarmer,
      };
      if (cleanedEmail !== null) {
        newUser.email = cleanedEmail;
      }

      const user = await User.create(newUser);

      // Respond with user details
      if (user) {
        res.status(201).json({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          isFarmer: user.isFarmer,
          token: generateToken(user._id),
        });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while registering user" });
  }
});

//@desc    Logout user
//route    POST /api/users/logout
//@access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "User logged out" }); // the logout should should be handleed by the frontend where we are destroying the token and clearing from local storage or whereever the FE is saving the token
});

//@desc    Get user profile
//route    GET /api/users/profile
//@access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User not found" });
  }
  res.status(200).json({
    _id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    phoneNumber: req.user.phoneNumber,
    isFarmer: req.user.isFarmer,
  });
});

//@desc    Update user profile
//route    PUT /api/users/profile
//@access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumber: updatedUser.phoneNumber,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

//@desc    Add item to cart
//@route   POST /api/cart/add
//@access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  // Check if the product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Find the user's cart or create a new one if it doesn't exist
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  // Check if the product is already in the cart
  const existingCartItem = cart.items.find(
    (item) => item.productId.toString() === productId
  );

  if (existingCartItem) {
    existingCartItem.quantity += quantity;
  } else {
    // Add new item to the cart
    cart.items.push({ productId, quantity });
  }

  // Save the cart
  const updatedCart = await cart.save();

  res.status(200).json({ message: "Item added to cart", cart: updatedCart });
});

//@desc    Get user's cart
//@route   GET /api/cart
//@access  Private
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find the user's cart
  const cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart) {
    return res.status(200).json({ items: [] }); // Return empty cart if cart is a falsy
  }

  res.status(200).json(cart);
});

//@desc    Update cart item quantity
//@route   PUT /api/cart/update
//@access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  // Validate the quantity
  if (quantity < 1) {
    res.status(400);
    throw new Error("Quantity must be at least 1");
  }

  // Find the user's cart (truthy)
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  // Find the cart item
  const cartItem = cart.items.find((item) => item.productId == productId);

  if (!cartItem) {
    res.status(404);
    throw new Error("Product not found in cart");
  }

  // Update the quantity
  cartItem.quantity = quantity;

  // Save the cart
  const updatedCart = await cart.save();

  res.status(200).json({ message: "Cart item updated", cart: updatedCart });
});

//@desc    Remove item from cart
//@route   DELETE /api/cart/remove/:productId
//@access  Private
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  // Find the user's cart
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  // Find the item in the cart
  const itemIndex = cart.items.findIndex((item) => item.productId == productId);

  if (itemIndex === -1) {
    res.status(404);
    throw new Error("Product not found in cart");
  }

  // Remove the item
  cart.items.splice(itemIndex, 1);

  // Save the cart
  const updatedCart = await cart.save();

  res
    .status(200)
    .json({ message: "Item removed from cart", cart: updatedCart });
});

//@desc    Clear user's cart
//@route   DELETE /api/cart/clear
//@access  Private
const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find the user's cart
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res
      .status(200)
      .json({ message: "Cart is already empty", cart: { items: [] } });
  }

  // Clear all items
  cart.items = [];

  // Save the cart
  const updatedCart = await cart.save();

  res.status(200).json({ message: "Cart cleared", cart: updatedCart });
});

// @desc Get all approved prelisted products
// @route GET /api/products/prelist/all
// @access Public
const getAllApprovedPrelistedProducts = asyncHandler(async (req, res) => {
  // Fetch all products with status 'approved'
  const products = await PreListProduct.find();

  res.status(200).json(products);
});

export {
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
  getAllApprovedPrelistedProducts,
};