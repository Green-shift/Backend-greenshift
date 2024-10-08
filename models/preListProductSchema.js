import mongoose from "mongoose";

const preListProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
  },
  stock: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  startHarvestDate: {
    type: Date, // Starting date of harvest
    required: true,
  },
  endHarvestDate: {
    type: Date, // Ending date of harvest
    required: true,
    validate: {
      validator: function (value) {
        return this.startHarvestDate < value;
      },
      message: "End harvest date must be after start harvest date",
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmer",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const PreListProduct = mongoose.model("PreListProduct", preListProductSchema);

export default PreListProduct;
