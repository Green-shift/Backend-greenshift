import mongoose  from 'mongoose';
import bcrypt from 'bcryptjs';

const farmerSchema = mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    businessCategories: {
        type: String,
        required: true,
    },
    businessState: {
        type: String,
        required: true,
    },
    businessLocalGovernmentArea: {
        type: String,
        required: true,
    },
    businessAddress: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isFarmer: {
        type: Boolean,
        required: true,
        default: true, 
    },
}, {
    timestamps: true
});

farmerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

farmerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Farmer = mongoose.model('Farmer', farmerSchema);

export default  Farmer;
