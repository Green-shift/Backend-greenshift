import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import Farmer from "../models/farmerModel.js";

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

  // Search by email if it's an email, otherwise search by phone number
  const user = isEmail
    ? await User.findOne({ email: credential })
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
      ? await Farmer.findOne({ email: credential })
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
//@desc    Register a new user or farmer
//route    POST /api/users
//@access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password, isFarmer } =
    req.body;

  // Ensure either email or phone number is provided
  if (!email && !phoneNumber) {
    res.status(400);
    throw new Error("Please provide either an email or a phone number");
  }

  // Check if user with provided email or phone number already exists
  const userExists = await User.findOne({
    $or: [{ email }, { phoneNumber }],
  });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email or phone number");
  }

  // Create new user
  const user = await User.create({
    email,
    firstName,
    lastName,
    phoneNumber,
    password,
    isFarmer,
  });

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
    res.status(400);
    throw new Error("Invalid user data");
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

export {
  authUserOrFarmer,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};
