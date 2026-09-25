// Secret Logo Click

const logo = document.querySelector(".logo");

if (logo) {
    let clicks = 0;

    logo.addEventListener("click", () => {
        clicks++;

        if (clicks === 5) {
            alert("🎉 Secret Mode Activated!");
            clicks = 0;
        }
    });
}

// Cursor Glow

const glow = document.querySelector(".cursor-glow");

if (glow) {
    document.addEventListener("mousemove", (e) => {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
    });
}

console.log("Sidebar JS Loaded");

// LOAD DEALS FROM BACKEND

async function loadDeals() {

    try {

        const response = await fetch(
            "https://velvet-aura-studio.onrender.com/api/deals"
        );

        const data = await response.json();

        const dealsContainer =
            document.getElementById("dealsContainer");

        if (!dealsContainer) return;

        dealsContainer.innerHTML = "";

        if (
            !data.success ||
            !data.deals ||
            data.deals.length === 0
        ) {

            dealsContainer.innerHTML =
                "<p>No deals available.</p>";

            return;
        }


        // =========================
        // GROUP PRODUCTS BY CATEGORY
        // =========================

        const categories = {};


// =========================
// CATEGORY NORMALIZATION
// =========================

function normalizeCategory(category) {

    const value = (category || "")
        .trim()
        .toLowerCase();

    // Electronics
    if (
        value === "electronics" ||
        value === "electronics & accessories" ||
        value === "electronics accessories"
    ) {
        return "Electronics";
    }


    // Computers
    if (
        value === "computers & laptops" ||
        value === "computer & accessories" ||
        value === "computers & accessories" ||
        value === "computer accessories"
    ) {
        return "Computers & Laptops";
    }


    // Sports
    if (
        value === "sports & fitness" ||
        value === "sports, fitness & outdoors" ||
        value === "sports fitness & outdoors" ||
        value === "sports & fitness & outdoors"
    ) {
        return "Sports & Fitness";
    }


    // Mobile
    if (
        value === "mobile" ||
        value === "mobiles" ||
        value === "mobile & accessories" ||
        value === "mobile accessories"
    ) {
        return "Mobile & Accessories";
    }


    // Camera
    if (
        value === "camera" ||
        value === "cameras" ||
        value === "camera & photography"
    ) {
        return "Camera & Photography";
    }


    // Audio
    if (
        value === "audio" ||
        value === "audio & accessories" ||
        value === "headphones" ||
        value === "headphones & earphones"
    ) {
        return "Audio";
    }


    // Fashion
    if (
        value === "fashion" ||
        value === "fashion & clothing" ||
        value === "clothing" ||
        value === "clothes"
    ) {
        return "Fashion & Clothing";
    }


    // Home
    if (
        value === "home" ||
        value === "home & kitchen" ||
        value === "home & lifestyle"
    ) {
        return "Home & Kitchen";
    }


    // Beauty
    if (
        value === "beauty" ||
        value === "beauty & personal care"
    ) {
        return "Beauty & Personal Care";
    }


    // Otherwise keep original category
    return category.trim() || "Other";
}


// =========================
// GROUP PRODUCTS
// =========================

data.deals.forEach((deal) => {

    const category =
        normalizeCategory(deal.category);

    if (!categories[category]) {

        categories[category] = [];

    }

    categories[category].push(deal);

});


        // =========================
        // CATEGORY ORDER
        // =========================

        const categoryOrder = [

            "Electronics",
            "Mobile & Accessories",
            "Computers & Laptops",
            "Camera & Photography",
            "Audio",
            "Home & Kitchen",
            "Fashion & Clothing",
            "Beauty & Personal Care",
            "Sports & Fitness",
            "Toys & Games",
            "Books",
            "Office Products",
            "Automotive",
            "Grocery",
            "Health & Household",
            "Other"

        ];


        // =========================
        // SORT CATEGORIES
        // =========================

        const sortedCategories =
            Object.keys(categories).sort((a, b) => {

                const aIndex =
                    categoryOrder.indexOf(a);

                const bIndex =
                    categoryOrder.indexOf(b);

                if (
                    aIndex === -1 &&
                    bIndex === -1
                ) {

                    return a.localeCompare(b);

                }

                if (aIndex === -1) return 1;

                if (bIndex === -1) return -1;

                return aIndex - bIndex;

            });


        // =========================
        // CREATE CATEGORY BOX
        // =========================

        sortedCategories.forEach((category) => {

            const products =
                categories[category];

            if (!products.length) return;


            const categoryBox =
                document.createElement("div");

            categoryBox.className =
                "category-deal-box";


            categoryBox.innerHTML = `

                <div class="category-deal-header">

                    <h3>
                        ${category}
                    </h3>

                    <a
                        href="search.html?q=${encodeURIComponent(category)}"
                        class="category-see-all"
                    >
                        →
                    </a>

                </div>

                <div class="category-products">
                </div>

            `;


            const productsContainer =
                categoryBox.querySelector(
                    ".category-products"
                );


            // =========================
            // ONLY 4 PRODUCTS
            // =========================

            products
                .slice(0, 4)
                .forEach((deal) => {

                    const product =
                        document.createElement("div");

                    product.className =
                        "category-product";


                    product.innerHTML = `

                        <a
                            href="product-details.html?id=${deal._id}"
                            class="category-product-link"
                        >

                            <div class="category-product-image">

                                <img
                                    src="${deal.image}"
                                    alt="${deal.productName}"
                                    loading="lazy"
                                >

                            </div>

                            <div class="category-product-name">
                                ${deal.productName}
                            </div>

                            <div class="category-product-price">

                                ₹${Number(
                                    deal.dealPrice
                                ).toLocaleString("en-IN")}

                            </div>

                        </a>

                    `;

                    productsContainer.appendChild(
                        product
                    );

                });


            dealsContainer.appendChild(
                categoryBox
            );

        });


    } catch (error) {

        console.error(
            "Error loading deals:",
            error
        );

    }

}

// Load deals when page opens

document.addEventListener(
    "DOMContentLoaded",
    loadDeals
);

// =========================
// PRODUCT SEARCH
// =========================

const searchInput = document.getElementById("productSearch");
const searchBtn = document.getElementById("searchBtn");
const productSuggestions =
    document.getElementById("productSuggestions");

if (searchInput && searchBtn) {

    searchBtn.addEventListener("click", searchProducts);

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            searchProducts();
        }
    });
}

async function searchProducts() {

    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        loadDeals();
        return;
    }

    try {

        const response = await fetch(
            "https://velvet-aura-studio.onrender.com/api/deals"
        );

        const data = await response.json();
        if (data.success && data.deals && productSuggestions) {

    productSuggestions.innerHTML = "";

    const suggestions = new Set();

    data.deals.forEach((deal) => {

        if (deal.productName) {
            suggestions.add(deal.productName);
        }

        if (deal.category) {
            suggestions.add(deal.category);
        }
    });

    suggestions.forEach((item) => {

        const option = document.createElement("option");

        option.value = item;

        productSuggestions.appendChild(option);

    });
}

        if (!data.success || !data.deals) {
            return;
        }

        const dealsContainer =
            document.getElementById("dealsContainer");

        dealsContainer.innerHTML = "";

        const results = data.deals.filter((deal) => {

    const productName =
        (deal.productName || "").toLowerCase();

    const description =
        (deal.description || "").toLowerCase();

    const category =
        (deal.category || "").toLowerCase();

    const affiliateUrl =
        (deal.affiliateUrl || "").toLowerCase();

    const words = query
        .split(/\s+/)
        .filter(Boolean);

    return words.some((word) => {

        if (
            productName.includes(word) ||
            description.includes(word) ||
            category.includes(word) ||
            affiliateUrl.includes(word)
        ) {
            return true;
        }

        if (
            ["cloth", "clothe", "clothes", "clothing", "fashion"]
                .some(term =>
                    word.includes(term) || term.includes(word)
                )
        ) {
            return (
                category.includes("clothing") ||
                category.includes("fashion") ||
                description.includes("clothing") ||
                description.includes("fashion")
            );
        }

        return false;
    });
});

        if (results.length === 0) {

            dealsContainer.innerHTML =
                "<p>No matching products found.</p>";

            return;
        }

        results.forEach((deal) => {

            const card = document.createElement("div");

            card.className = "project-card";

            card.innerHTML = `
                <div class="project-image">
                    <img
                        src="${deal.image}"
                        alt="${deal.productName}"
                    >
                </div>

                <div class="project-content">

                    <h3>${deal.productName}</h3>

                    <p>${deal.description}</p>

                    <p>
                        <del>₹${deal.originalPrice.toLocaleString("en-IN")}</del>
                        <strong>
                            ₹${deal.dealPrice.toLocaleString("en-IN")}
                        </strong>
                        <span>${deal.discount}% OFF</span>
                    </p>

                    <a
                        href="product-details.html?id=${deal._id}"
                        class="project-btn"
                    >
                        Buy Now
                    </a>

                </div>
            `;

            dealsContainer.appendChild(card);
        });

        document.getElementById("deals")
            .scrollIntoView({ behavior: "smooth" });

    } catch (error) {

        console.error("Search error:", error);

    }
}