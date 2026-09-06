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

const PORT = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI;


// =========================
// MONGODB CONNECTION
// =========================

mongoose.connect(uri)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log("❌ MongoDB Error:");
    console.log(err);
});


// =========================
// BASIC ROUTES
// =========================

app.get("/", (req, res) => {
    res.send("Server Working 🚀");
});

app.get("/api/test", (req, res) => {
    res.json({
        message: "Backend Working Successfully"
    });
});


// =========================
// REGISTER
// =========================

app.get("/register", (req, res) => {
    res.send("Register API is Ready. Use POST request.");
});

app.post("/register", async (req, res) => {

    try {

        const hashedPassword = await bcrypt.hash(
            req.body.password,
            10
        );

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


// =========================
// LOGIN
// =========================

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

            {
                expiresIn: "7d"
            }

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


// ==================================================
// DEALS
// ==================================================


// =========================
// ADD DEAL
// =========================

app.post("/api/deals", async (req, res) => {

    try {

        /*
        Multiple images receive honge:

        images: [
            "image1",
            "image2",
            "image3"
        ]
        */

        let images = [];

        if (Array.isArray(req.body.images)) {

            images = req.body.images

                .map(image => String(image).trim())

                .filter(Boolean);

        }

        /*
        Agar old frontend se sirf image aa rahi hai
        to usko bhi support karenge.
        */

        if (
            images.length === 0 &&
            req.body.image
        ) {

            images = [
                String(req.body.image).trim()
            ];

        }

        /*
        First image ko old "image" field mein bhi save
        kar rahe hain.

        Isse purana frontend bhi work karega.
        */

        const firstImage = images[0] || "";


        // Tags

        let tags = [];

        if (Array.isArray(req.body.tags)) {

            tags = req.body.tags

                .map(tag => String(tag).trim().toLowerCase())

                .filter(Boolean);

        }


        const deal = new Deal({

            productName:
                req.body.productName,

            description:
                req.body.description,

            image:
                firstImage,

            images:
                images,

            originalPrice:
                Number(req.body.originalPrice),

            dealPrice:
                Number(req.body.dealPrice),

            discount:
                Number(req.body.discount),

            store:
                req.body.store,

            affiliateUrl:
                req.body.affiliateUrl,

            category:
                req.body.category || "Other",

            tags:
                tags,

            amazonProductId:
                req.body.amazonProductId || ""

        });


        await deal.save();


        res.status(201).json({

            success: true,

            message: "Deal Saved Successfully",

            deal: deal

        });

    } catch (err) {

        console.log("ADD DEAL ERROR:", err);

        res.status(500).json({

            success: false,

            message: "Error Saving Deal"

        });

    }

});


// =========================
// GET ALL DEALS
// =========================

app.get("/api/deals", async (req, res) => {

    try {

        const deals = await Deal.find()

            .sort({
                _id: -1
            });


        res.json({

            success: true,

            deals: deals

        });

    } catch (err) {

        console.log(
            "GET DEALS ERROR:",
            err
        );

        res.status(500).json({

            success: false,

            message: "Failed to fetch deals"

        });

    }

});


// =========================
// EDIT / UPDATE DEAL
// =========================

app.put("/api/deals/:id", async (req, res) => {

    try {

        let images = [];

        /*
        New multiple-image system
        */

        if (Array.isArray(req.body.images)) {

            images = req.body.images

                .map(image =>
                    String(image).trim()
                )

                .filter(Boolean);

        }


        /*
        Old product compatibility
        */

        if (
            images.length === 0 &&
            req.body.image
        ) {

            images = [
                String(req.body.image).trim()
            ];

        }


        const firstImage =
            images[0] || "";


        // Tags

        let tags = [];

        if (Array.isArray(req.body.tags)) {

            tags = req.body.tags

                .map(tag =>
                    String(tag)
                        .trim()
                        .toLowerCase()
                )

                .filter(Boolean);

        }


        const updatedDeal =
            await Deal.findByIdAndUpdate(

                req.params.id,

                {

                    productName:
                        req.body.productName,

                    description:
                        req.body.description,

                    image:
                        firstImage,

                    images:
                        images,

                    originalPrice:
                        Number(req.body.originalPrice),

                    dealPrice:
                        Number(req.body.dealPrice),

                    discount:
                        Number(req.body.discount),

                    store:
                        req.body.store,

                    affiliateUrl:
                        req.body.affiliateUrl,

                    category:
                        req.body.category || "Other",

                    tags:
                        tags,

                    amazonProductId:
                        req.body.amazonProductId || ""

                },

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!updatedDeal) {

            return res.status(404).json({

                success: false,

                message: "Deal not found"

            });

        }


        res.json({

            success: true,

            message: "Deal Updated Successfully",

            deal: updatedDeal

        });

    } catch (err) {

        console.log(
            "UPDATE DEAL ERROR:",
            err
        );

        res.status(500).json({

            success: false,

            message: "Error Updating Deal"

        });

    }

});


// =========================
// DELETE DEAL
// =========================

app.delete("/api/deals/:id", async (req, res) => {

    try {

        const deletedDeal =
            await Deal.findByIdAndDelete(
                req.params.id
            );


        if (!deletedDeal) {

            return res.status(404).json({

                success: false,

                message: "Deal not found"

            });

        }


        res.json({

            success: true,

            message: "Deal deleted successfully"

        });

    } catch (err) {

        console.log(
            "DELETE DEAL ERROR:",
            err
        );

        res.status(500).json({

            success: false,

            message: "Error deleting deal"

        });

    }

});


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});