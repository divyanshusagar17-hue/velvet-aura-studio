import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);

// SIGNUP

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name,
        email: email,
        profileCompleted: false
      });

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

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userDoc = await getDoc(
        doc(db, "users", userCredential.user.uid)
      );

      if (userDoc.exists() && !userDoc.data().profileCompleted) {

        window.location.href = "complete-profile.html";

      } else {

        window.location.href = "index.html";

      }

    } catch (error) {

      alert(error.code + " : " + error.message);
      console.error(error);

    }
  });
}

// LOGIN STATUS CHECK

onAuthStateChanged(auth, (user) => {

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {

    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

  } else {

    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";

  }

});

// LOGOUT

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    alert("Logged Out");

    window.location.href = "login.html";

  });

}