import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import Farmer from '../models/farmerModel.js';


// @desc    Auth user or farmer / set token
// @route   POST /api/auth
// @access  Public
const authUserOrFarmer = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if the user exists in the User collection
    let user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // If user is found in User collection
        const token = generateToken(user._id);
        res.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isFarmer: user.isFarmer,
            token,
        });
    } else {
        // If not found in User collection, check the Farmer collection
        const farmer = await Farmer.findOne({ email });

        if (farmer && (await farmer.matchPassword(password))) {
            // If farmer is found in Farmer collection
            const token = generateToken(farmer._id);
            res.status(200).json({
                _id: farmer._id,
                email: farmer.email,
                businessCategories: farmer.businessCategories,
                businessState: farmer.businessState,
                businessLocalGovernmentArea: farmer.businessLocalGovernmentArea,
                businessAddress: farmer.businessAddress,
                isFarmer: true,
                token,
            });
        } else {
            // If neither user nor farmer is found
            res.status(401);
            throw new Error('Invalid email or password');
        }
    }
});


//@desc    Register a new user
//route    POST /api/users
//@access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password, isFarmer } = req.body;

    // Checking if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Creating new user
    const user = await User.create({
        email,
        firstName,
        lastName,
        phoneNumber,
        password,
        isFarmer
    });

    // If user creation is successful
    if (user) {
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            isFarmer: user.isFarmer,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

//@desc    Logout user
//route    POST /api/users/logout
//@access  Public
const logoutUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'User logged out' }); // the logout should should be handleed by the frontend where we are destroying the token and clearing from local storage or whereever the FE is saving the token
});


//@desc    Get user profile
//route    GET /api/users/profile
//@access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(400).json({ message: 'User not found' });
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
        throw new Error('User not found');
    }
});

export {
    authUserOrFarmer,
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
};
