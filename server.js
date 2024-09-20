import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import { notFound, errorHandler } from "./middleware/userMiddleware.js";
import connectDB from "./config/db.js";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

dotenv.config();
const port = process.env.PORT || 5000;

connectDB();

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/farmers", farmerRoutes);

app.get("/", (req, res) => res.send("Server is ready"));

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));
