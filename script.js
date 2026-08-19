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

// ===============================
// LOAD DEALS FROM BACKEND
// ===============================

async function loadDeals() {
    try {
        const response = await fetch("http://localhost:3000/api/deals");
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