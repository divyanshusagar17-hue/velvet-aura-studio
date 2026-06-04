const text = ["Web Developer", "Frontend Developer", "Freelancer"];
let i = 0;
let j = 0;
let current = "";

function type() {
  if (j < text[i].length) {
    current += text[i][j];
    document.getElementById("typing").innerHTML = current;
    j++;
    setTimeout(type, 100);
  } else {
    setTimeout(() => {
      current = "";
      j = 0;
      i = (i + 1) % text.length;
      type();
    }, 1500);
  }
}

type();
let clicks = 0;

document.querySelector(".logo").addEventListener("click", () => {
    clicks++;

    if(clicks === 5){
        alert("🎉 Secret Mode Activated!");
        clicks = 0;
    }
});
const glow = document.querySelector(".cursor-glow");

document.addEventListener("mousemove", (e)=>{
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
});