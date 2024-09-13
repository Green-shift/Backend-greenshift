import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/productSchema.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateProducts() {
  try {
    const products = await Product.find({});

    for (let product of products) {
      // Convert bidPrice to price
      if (product.bidPrice) {
        product.price = product.bidPrice;
      }

      if (!product.produceName) {
        product.produceName = product.produceType || "Unknown Product";
      }

      // Set default values for new fields
      if (!product.description)
        product.description = "No description available";
      if (!product.bulkPrice) product.bulkPrice = product.price;
      if (!product.imagePath) product.imagePath = null;

      // Remove old fields
      product.bidPrice = undefined;
      product.bidPeriod = undefined;
      product.produceType = undefined;

      await product.save();
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

migrateProducts();
