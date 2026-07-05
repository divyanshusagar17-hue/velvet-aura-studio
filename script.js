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
