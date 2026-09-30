
const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Deal = require("./models/Deal");


// =========================
// AMAZON CREATORS API
// =========================

const AMAZON_TOKEN_URL =
    "https://api.amazon.co.uk/auth/o2/token";

const AMAZON_API_URL =
    "https://creatorsapi.amazon/catalog/v1/getItems";

let amazonToken = null;
let amazonTokenExpiresAt = 0;

async function getAmazonAccessToken() {
    if (
        amazonToken &&
        Date.now() < amazonTokenExpiresAt
    ) {
        return amazonToken;
    }

    const clientId =
        process.env.CREATORS_API_CREDENTIAL_ID;
    const clientSecret =
        process.env.CREATORS_API_CREDENTIAL_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "Amazon API credentials are missing"
        );
    }

    const response = await fetch(AMAZON_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            scope: "creatorsapi::default"
        })
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
        console.log("Amazon token error:", data);
        throw new Error(
            "Could not authenticate with Amazon"
        );
    }

    amazonToken = data.access_token;
    amazonTokenExpiresAt =
        Date.now() + (data.expires_in - 60) * 1000;

    return amazonToken;
}

function extractAmazonASIN(url) {
    const match = String(url).match(
        /\/(?:dp|gp\/product|商品\/[^/]+)\/([A-Z0-9]{10})/i
    );

    return match ? match[1].toUpperCase() : null;
}

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;


// =========================
// MONGODB CONNECTION
// =========================

mongoose
    .connect(uri)
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


app.post("/api/amazon/product", async (req, res) => {
    try {
        const productUrl = req.body.url;

        if (!productUrl) {
            return res.status(400).json({
                success: false,
                message: "Amazon product URL is required"
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(productUrl);
        } catch {
            return res.status(400).json({
                success: false,
                message: "Invalid product URL"
            });
        }

        if (
            !["amazon.in", "www.amazon.in"].includes(
                parsedUrl.hostname.toLowerCase()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter an Amazon India URL"
            });
        }

        const asin = extractAmazonASIN(
            parsedUrl.pathname
        );

        if (!asin) {
            return res.status(400).json({
                success: false,
                message: "Could not find product ASIN in URL"
            });
        }

        const partnerTag =
            process.env.AMAZON_PARTNER_TAG;

        if (!partnerTag) {
            return res.status(500).json({
                success: false,
                message: "Amazon Partner Tag is not configured"
            });
        }

        const token = await getAmazonAccessToken();

        const response = await fetch(AMAZON_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "x-marketplace": "www.amazon.in"
            },
            body: JSON.stringify({
                itemIds: [asin],
                itemIdType: "ASIN",
                marketplace: "www.amazon.in",
                partnerTag: partnerTag,
                resources: [
                    "images.primary.large",
                    "itemInfo.title",
                    "itemInfo.features",
                    "offersV2"
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("Amazon API error:", data);

            return res.status(response.status).json({
                success: false,
                message: "Amazon product lookup failed"
            });
        }

        const item =
            data.itemsResult?.items?.[0];

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Product not found in Amazon API"
            });
        }

        const title =
            item.itemInfo?.title?.displayValue || "";

        const image =
            item.images?.primary?.large?.url ||
            item.images?.primary?.medium?.url ||
            item.images?.primary?.small?.url ||
            "";

        const features =
            item.itemInfo?.features?.displayValues || [];

        res.json({
            success: true,
            product: {
                asin: item.asin || asin,
                productName: title,
                image: image,
                description: features.join("\n"),
                affiliateUrl: item.detailPageURL || ""
            }
        });

    } catch (err) {
        console.log("AMAZON LOOKUP ERROR:", err);

        res.status(500).json({
            success: false,
            message: "Amazon product lookup failed"
        });
    }
});

// =========================
// ADD DEAL
// =========================

app.post("/api/deals", async (req, res) => {
    try {
        // Multiple images
        let images = [];

        if (Array.isArray(req.body.images)) {
            images = req.body.images
                .map((image) => String(image).trim())
                .filter(Boolean);
        }

        // Old frontend compatibility
        if (
            images.length === 0 &&
            req.body.image
        ) {
            images = [
                String(req.body.image).trim()
            ];
        }

        // First image for old frontend
        const firstImage = images[0] || "";


        // Tags
        let tags = [];

        if (Array.isArray(req.body.tags)) {
            tags = req.body.tags
                .map((tag) =>
                    String(tag).trim().toLowerCase()
                )
                .filter(Boolean);
        }


        // Create deal
        const deal = new Deal({
            productName: req.body.productName,
            description: req.body.description,

            image: firstImage,
            images: images,

            originalPrice: Number(req.body.originalPrice),
            dealPrice: Number(req.body.dealPrice),
            discount: Number(req.body.discount),

            store: req.body.store,
            affiliateUrl: req.body.affiliateUrl,

            category: req.body.category || "Other",
            tags: tags,

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
        console.log("GET DEALS ERROR:", err);

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
        // Multiple images
        let images = [];

        if (Array.isArray(req.body.images)) {
            images = req.body.images
                .map((image) => String(image).trim())
                .filter(Boolean);
        }

        // Old product compatibility
        if (
            images.length === 0 &&
            req.body.image
        ) {
            images = [
                String(req.body.image).trim()
            ];
        }

        const firstImage = images[0] || "";


        // Tags
        let tags = [];

        if (Array.isArray(req.body.tags)) {
            tags = req.body.tags
                .map((tag) =>
                    String(tag).trim().toLowerCase()
                )
                .filter(Boolean);
        }


        // Find existing deal
        const existingDeal = await Deal.findById(
            req.params.id
        );

        if (!existingDeal) {
            return res.status(404).json({
                success: false,
                message: "Deal not found"
            });
        }


        // Convert incoming prices
        const newOriginalPrice = Number(
            req.body.originalPrice
        );

        const newDealPrice = Number(
            req.body.dealPrice
        );

        const newDiscount = Number(
            req.body.discount
        );


        // Validate numeric values
        if (
            !Number.isFinite(newOriginalPrice) ||
            !Number.isFinite(newDealPrice) ||
            !Number.isFinite(newDiscount)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid price or discount"
            });
        }


        // Check whether price changed
        const priceChanged =
            existingDeal.originalPrice !== newOriginalPrice ||
            existingDeal.dealPrice !== newDealPrice;


        // Save baseline if history is empty
        if (
            !existingDeal.priceHistory ||
            existingDeal.priceHistory.length === 0
        ) {
            existingDeal.priceHistory = [];

            existingDeal.priceHistory.push({
                originalPrice: existingDeal.originalPrice,
                dealPrice: existingDeal.dealPrice,
                recordedAt:
                    existingDeal.createdAt || new Date(),
                source: "initial"
            });
        }


        // Add new history entry only if price changed
        if (priceChanged) {
            existingDeal.priceHistory.push({
                originalPrice: newOriginalPrice,
                dealPrice: newDealPrice,
                recordedAt: new Date(),
                source: "manual"
            });
        }


        // Update deal details
        existingDeal.productName = req.body.productName;
        existingDeal.description = req.body.description;

        existingDeal.image = firstImage;
        existingDeal.images = images;

        existingDeal.originalPrice = newOriginalPrice;
        existingDeal.dealPrice = newDealPrice;
        existingDeal.discount = newDiscount;

        existingDeal.store = req.body.store;
        existingDeal.affiliateUrl = req.body.affiliateUrl;

        existingDeal.category =
            req.body.category || "Other";

        existingDeal.tags = tags;

        existingDeal.amazonProductId =
            req.body.amazonProductId || "";


        // Save updated deal and price history
        const updatedDeal = await existingDeal.save();


        res.json({
            success: true,
            message: "Deal Updated Successfully",
            deal: updatedDeal
        });

    } catch (err) {
        console.log("UPDATE DEAL ERROR:", err);

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
        console.log("DELETE DEAL ERROR:", err);

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