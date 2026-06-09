import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
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

// Signup
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
      alert(error.message);
    }
  });
}

// Login
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
  console.log(error);
  alert(error.code);
}