require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/aina_children_home", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Admin Schema
const AdminSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const Admin = mongoose.model("Admin", AdminSchema);

// Admin Registration Route (One-time use to create admin)
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashedPassword });
    await newAdmin.save();
    res.status(201).send("Admin registered successfully!");
  } catch (error) {
    res.status(500).send("Error registering admin.");
  }
});

// Admin Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).send("Invalid email or password.");

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).send("Invalid email or password.");

    const token = jwt.sign({ adminId: admin._id }, "secret_key", { expiresIn: "1h" });

    res.json({ token });
  } catch (error) {
    res.status(500).send("Server error.");
  }
});

// Protected Route (For Testing)
app.get("/dashboard", (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).send("Access Denied.");

  try {
    const decoded = jwt.verify(token, "secret_key");
    res.send("Welcome to the Admin Dashboard!");
  } catch (error) {
    res.status(401).send("Invalid Token.");
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
