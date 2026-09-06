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
        const response = await fetch("https://velvet-aura-studio.onrender.com/api/deals");
        const data = await response.json();

        const dealsContainer = document.getElementById("dealsContainer");

        if (!dealsContainer) return;

        dealsContainer.innerHTML = "";

        if (!data.success || !data.deals || data.deals.length === 0) {
            dealsContainer.innerHTML = "<p>No deals available.</p>";
            return;
        }

        data.deals.forEach((deal) => {
             
            const card = document.createElement("div");
            card.className = "project-card";

            card.innerHTML = `
                <div class="project-image">
                    <img src="${deal.image}" alt="${deal.productName}">
                </div>

                <div class="project-content">

                    <h3>${deal.productName}</h3>

                    <p>
                        ${deal.description}
                    </p>

                    <p>
                        <del>₹${deal.originalPrice.toLocaleString("en-IN")}</del>
                        <strong> ₹${deal.dealPrice.toLocaleString("en-IN")}</strong>
                        <span> ${deal.discount}% OFF</span>
                    </p>

                    <a href="${deal.affiliateUrl}"
                       target="_blank"
                       class="project-btn">
                        View Deal
                    </a>

                </div>
            `;

            dealsContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading deals:", error);
    }
}


// Load deals when page opens
document.addEventListener("DOMContentLoaded", loadDeals);

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
                        href="${deal.affiliateUrl}"
                        target="_blank"
                        class="project-btn"
                    >
                        View Deal
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