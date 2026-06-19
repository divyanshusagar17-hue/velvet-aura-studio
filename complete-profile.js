import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  updateDoc
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

const profileForm = document.getElementById("profileForm");

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  profileForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const city = document.getElementById("city").value;
    const college = document.getElementById("college").value;

    try {

      await updateDoc(doc(db, "users", user.uid), {
        city: city,
        college: college,
        profileCompleted: true
      });

      alert("Profile Updated!");
      window.location.href = "index.html";

    } catch (error) {

      console.error(error);
      alert(error.message);

    }

  });

});