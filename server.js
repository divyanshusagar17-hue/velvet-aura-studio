const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Deal = require("./models/Deal");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log("❌ MongoDB Error:");
    console.log(err);
});

app.get("/", (req, res) => {
    res.send("Server Working 🚀");
});

app.get("/api/test", (req, res) => {
    res.json({
        message: "Backend Working Successfully"
    });
});

app.get("/register", (req, res) => {
    res.send("Register API is Ready. Use POST request.");
});

app.post("/register", async (req, res) => {
    try {

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role
        });

        await user.save();

       res.status(201).json({
    success: true,
    message: "User Saved Successfully"
});

    } catch (err) {

        console.log(err);

        res.status(500).json({
    success: false,
    message: "Error Saving User"
});

    }
});

app.post("/login", async (req, res) => {
    try {

        const user = await User.findOne({
            email: req.body.email
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Wrong Password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Login Successful",
            token
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: "Login Failed"
        });
    }
});

app.post("/api/deals", async (req, res) => {
    try {

        const deal = new Deal({
            productName: req.body.productName,
            description: req.body.description,
            image: req.body.image,
            originalPrice: req.body.originalPrice,
            dealPrice: req.body.dealPrice,
            discount: req.body.discount,
            store: req.body.store,
            affiliateUrl: req.body.affiliateUrl,
            category: req.body.category
        });

        await deal.save();

        res.status(201).json({
            success: true,
            message: "Deal Saved Successfully",
            deal: deal
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Error Saving Deal"
        });

    }
});

app.get("/api/deals", async (req, res) => {
    try {

        const deals = await Deal.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            deals: deals
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Error Fetching Deals"
        });

    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});