import jwt from "jsonwebtoken";
import User from '../models/userModel.js';
import Farmer from "../models/farmerModel.js";

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from the Authorization header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            
            let user = await User.findById(decoded.userId);

            // If the user is not found, try the Farmer model
            if (!user) {
                user = await Farmer.findById(decoded.userId);
                
                if (!user) {
                    return res.status(404).json({ message: 'User or Farmer not found' });
                }
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, invalid token' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const farmerOnly = (req, res, next) => {
    if (req.user && req.user.isFarmer) {
        next(); // Farmer is authorized
    } else {
        res.status(403).json({ message: 'Access denied: Farmers only' });
    }
};

const userOnly = (req, res, next) => {
    if (req.user && !req.user.isFarmer) {
        next(); // Regular user is authorized
    } else {
        res.status(403).json({ message: 'Access denied: Users only' });
    }
};


export { protect, userOnly, farmerOnly };
