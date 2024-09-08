import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer', 
        required: true
    },
    produceType: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    bidPrice: {
        type: Number,
        required: true,
    },
    bidPeriod: {
        type: Date,
        required: true,
    },
    bidders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
