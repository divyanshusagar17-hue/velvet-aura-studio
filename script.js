// Secret Logo Click

 logo = document.querySelector(".logo");

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

 glow = document.querySelector(".cursor-glow");

if (glow) {
    document.addEventListener("mousemove", (e) => {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
    });
}

// Music

const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");

if (music && musicBtn) {
    musicBtn.addEventListener("click", () => {

        if (music.paused) {
            music.play();
            musicBtn.innerHTML = "🔇 Stop Music";
        } else {
            music.pause();
            musicBtn.innerHTML = "🎵 Play Music";
        }

    });
}