
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("./models/User");
const Deal = require("./models/Deal");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

// =========================
// AMAZON CREATORS API
// =========================

const AMAZON_TOKEN_URL =
    "https://api.amazon.co.uk/auth/o2/token";

const AMAZON_API_URL =
    "https://creatorsapi.amazon/catalog/v1/getItems";

const ALLOWED_AMAZON_HOSTS = [
    "amazon.in",
    "www.amazon.in",
    "link.amazon",
    "amzn.to",
    "amzn.in"
];

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
        Date.now() +
        Math.max(
            0,
            (Number(data.expires_in) || 3600) - 60
        ) * 1000;

    return amazonToken;
}

function extractAmazonASIN(urlPath) {
    const match = String(urlPath).match(
        /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i
    );

    return match ? match[1].toUpperCase() : null;
}

// Follow short-link redirects, checking every destination.
async function resolveAmazonShortLink(startUrl) {
    let currentUrl = new URL(startUrl);

    for (let i = 0; i < 6; i++) {
        const hostname = currentUrl.hostname.toLowerCase();

        if (
            currentUrl.protocol !== "https:" ||
            !ALLOWED_AMAZON_HOSTS.includes(hostname)
        ) {
            throw new Error(
                "Redirected to an unsupported URL"
            );
        }

        if (
            hostname === "amazon.in" ||
            hostname === "www.amazon.in"
        ) {
            return currentUrl;
        }

        const response = await fetch(currentUrl, {
            method: "GET",
            redirect: "manual"
        });

        const location = response.headers.get("location");

        if (response.body) {
            await response.body.cancel();
        }

        if (
            response.status < 300 ||
            response.status >= 400 ||
            !location
        ) {
            throw new Error(
                "Could not resolve the Amazon short link"
            );
        }

        currentUrl = new URL(location, currentUrl);
    }

    throw new Error("Too many redirects");
}

// =========================
// MONGODB CONNECTION
// =========================

mongoose
    .connect(uri)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.log("MongoDB Error:", err);
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
        const { fullName, email, password, role } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const user = new User({
            fullName,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "User Saved Successfully"
        });
    } catch (err) {
        console.log("REGISTER ERROR:", err);

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

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing");
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
        console.log("LOGIN ERROR:", err);

        res.status(500).json({
            success: false,
            message: "Login Failed"
        });
    }
});

// =========================
// AMAZON AFFILIATE AUTO-FILL
// =========================

app.post("/api/amazon/auto-fill", async (req, res) => {
    try {
        const affiliateUrl = String(req.body.url || "").trim();

        if (!affiliateUrl) {
            return res.status(400).json({
                success: false,
                message: "Amazon affiliate link is required"
            });
        }

        const inputUrl = new URL(affiliateUrl);

        const allowedHosts = [
            "link.amazon",
            "amzn.to",
            "amzn.in",
            "amazon.in",
            "www.amazon.in"
        ];

        if (
            inputUrl.protocol !== "https:" ||
            !allowedHosts.includes(inputUrl.hostname.toLowerCase())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid Amazon affiliate link"
            });
        }

        // Short affiliate link ko Amazon product page tak follow karo
        console.log("AMAZON AUTO-FILL INPUT:", affiliateUrl);
        const response = await fetch(affiliateUrl, {
            method: "GET",
            redirect: "follow"
        });

        const finalUrl = new URL(response.url);
        console.log("AMAZON AUTO-FILL FINAL URL:", response.url);
        console.log("AMAZON RESPONSE STATUS:", response.status);

        if (
            !["amazon.in", "www.amazon.in"].includes(
                finalUrl.hostname.toLowerCase()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Amazon product link resolve nahi hua"
            });
        }

        // Amazon product URL se ASIN nikalo
        const asinMatch = finalUrl.pathname.match(
            /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i
        );

        if (!asinMatch) {
            return res.status(400).json({
                success: false,
                message: "Product ASIN nahi mila"
            });
        }

        const asin = asinMatch[1].toUpperCase();

        // Amazon product page HTML read karo
        const html = await response.text();

        function getMeta(property) {
            const regex = new RegExp(
                `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
                "i"
            );

            const match = html.match(regex);
            return match ? match[1].trim() : "";
        }

        function cleanText(value) {
            return String(value || "")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .trim();
        }

        const productName = cleanText(
            getMeta("og:title")
        );

        const image = cleanText(
            getMeta("og:image")
        );

        const description = cleanText(
            getMeta("og:description")
        );

        // Original affiliate link ko hi preserve karo
        res.json({
            success: true,
            product: {
                asin,
                productName,
                description,
                images: image ? [image] : [],
                originalPrice: "",
                dealPrice: "",
                discount: "",
                category: "Other",
                tags: ["amazon"],
                affiliateUrl
            }
        });

    } catch (error) {
        console.log(
            "AMAZON AUTO-FILL ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Amazon product data fetch nahi ho paya"
        });
    }
});

// =========================
// AMAZON PRODUCT LOOKUP
// =========================

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
            parsedUrl.protocol !== "https:" ||
            !ALLOWED_AMAZON_HOSTS.includes(
                parsedUrl.hostname.toLowerCase()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid Amazon link"
            });
        }

        let finalUrl;

        try {
            finalUrl = await resolveAmazonShortLink(
                parsedUrl.toString()
            );
        } catch (err) {
            console.log("AMAZON LINK ERROR:", err.message);

            return res.status(400).json({
                success: false,
                message:
                    "Could not open this short link. Try an Amazon.in product link."
            });
        }

        const asin = extractAmazonASIN(
            finalUrl.pathname
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
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "x-marketplace": "www.amazon.in"
            },
            body: JSON.stringify({
                itemIds: [asin],
                itemIdType: "ASIN",
                marketplace: "www.amazon.in",
                partnerTag,
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

            return res.status(502).json({
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
                image,
                description: features.join("\n"),
                affiliateUrl:
                    item.detailPageURL || productUrl
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
        let images = [];

        if (Array.isArray(req.body.images)) {
            images = req.body.images
                .map((image) => String(image).trim())
                .filter(Boolean);
        }

        if (images.length === 0 && req.body.image) {
            images = [String(req.body.image).trim()];
        }

        const firstImage = images[0] || "";

        let tags = [];

        if (Array.isArray(req.body.tags)) {
            tags = req.body.tags
                .map((tag) =>
                    String(tag).trim().toLowerCase()
                )
                .filter(Boolean);
        }

        const deal = new Deal({
            productName: req.body.productName,
            description: req.body.description,

            image: firstImage,
            images,

            originalPrice: Number(req.body.originalPrice),
            dealPrice: Number(req.body.dealPrice),
            discount: Number(req.body.discount),

            store: req.body.store,
            affiliateUrl: req.body.affiliateUrl,

            category: req.body.category || "Other",
            tags,

            amazonProductId:
                req.body.amazonProductId || ""
        });

        await deal.save();

        res.status(201).json({
            success: true,
            message: "Deal Saved Successfully",
            deal
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
        const deals = await Deal.find().sort({
            _id: -1
        });

        res.json({
            success: true,
            deals
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
        let images = [];

        if (Array.isArray(req.body.images)) {
            images = req.body.images
                .map((image) => String(image).trim())
                .filter(Boolean);
        }

        if (images.length === 0 && req.body.image) {
            images = [String(req.body.image).trim()];
        }

        const firstImage = images[0] || "";

        let tags = [];

        if (Array.isArray(req.body.tags)) {
            tags = req.body.tags
                .map((tag) =>
                    String(tag).trim().toLowerCase()
                )
                .filter(Boolean);
        }

        const existingDeal = await Deal.findById(
            req.params.id
        );

        if (!existingDeal) {
            return res.status(404).json({
                success: false,
                message: "Deal not found"
            });
        }

        const newOriginalPrice = Number(
            req.body.originalPrice
        );

        const newDealPrice = Number(
            req.body.dealPrice
        );

        const newDiscount = Number(
            req.body.discount
        );

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

        const priceChanged =
            existingDeal.originalPrice !== newOriginalPrice ||
            existingDeal.dealPrice !== newDealPrice;

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

        if (priceChanged) {
            existingDeal.priceHistory.push({
                originalPrice: newOriginalPrice,
                dealPrice: newDealPrice,
                recordedAt: new Date(),
                source: "manual"
            });
        }

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
            await Deal.findByIdAndDelete(req.params.id);

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
    console.log(`Server running on port ${PORT}`);
});