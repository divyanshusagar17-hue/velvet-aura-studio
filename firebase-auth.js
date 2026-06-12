import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZWkXq52l7C-GI0lDHoShOpKbEIxwzct0",
  authDomain: "velvet-aura-studio.firebaseapp.com",
  projectId: "velvet-aura-studio",
  storageBucket: "velvet-aura-studio.firebasestorage.app",
  messagingSenderId: "206602998276",
  appId: "1:206602998276:web:0531ac6a3b5345c0c85b51",
  measurementId: "G-P0Y33YQ0HN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// SIGNUP
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Signup Successful!");
      window.location.href = "login.html";
    } catch (error) {
      alert(error.code + " : " + error.message);
      console.error(error);
    }
  });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful!");
      window.location.href = "index.html";
    } catch (error) {
      alert(error.code + " : " + error.message);
      console.error(error);
    }
  });
}

// Login Status Check

onAuthStateChanged(auth, (user) => {

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {

    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    if (window.location.pathname.includes("login.html")) {
      window.location.href = "index.html";
    }

  } else {

    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";

  }

});

// Logout

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    alert("Logged Out");

    window.location.href = "login.html";

  });

}