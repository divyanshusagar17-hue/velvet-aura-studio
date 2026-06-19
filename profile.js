import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
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

const editBtn = document.getElementById("editBtn");
const editForm = document.getElementById("editForm");

let currentUser;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {

    const data = docSnap.data();

    document.getElementById("profileName").textContent = data.name || "Not added";

    document.getElementById("profileEmail").textContent = data.email || "Not added";

    document.getElementById("profileCity").textContent = data.city || "Not added";

    document.getElementById("profileCollege").textContent = data.college || "Not added";

    document.getElementById("editName").value = data.name || "";

    document.getElementById("editCity").value = data.city || "";

    document.getElementById("editCollege").value = data.college || "";
}

});

editBtn.addEventListener("click", () => {

  if (editForm.style.display === "none") {
    editForm.style.display = "block";
    editBtn.textContent = "Cancel";
  } else {
    editForm.style.display = "none";
    editBtn.textContent = "Edit Profile";
  }

});

editForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const name = document.getElementById("editName").value;
  const city = document.getElementById("editCity").value;
  const college = document.getElementById("editCollege").value;

  try {

    await updateDoc(doc(db, "users", currentUser.uid), {
      name: name,
      city: city,
      college: college
    });

    document.getElementById("profileName").textContent = name;
    document.getElementById("profileCity").textContent = city;
    document.getElementById("profileCollege").textContent = college;

    editForm.style.display = "none";
    editBtn.textContent = "Edit Profile";

    alert("Profile Updated!");

  } catch (error) {

    console.error(error);
    alert(error.message);

  }

});
