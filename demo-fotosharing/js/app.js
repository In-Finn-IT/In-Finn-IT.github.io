// 🔧 AUF SERVER:
const pb = new PocketBase("/api");

const authSection = document.getElementById("authSection");
const uploadSection = document.getElementById("uploadSection");
const gallery = document.getElementById("gallery");

// 🔁 UI wechseln
function updateUI() {
  if (pb.authStore.isValid) {
    authSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    loadPhotos();
  } else {
    authSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
  }
}

// 🔐 Login
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await pb.collection("users").authWithPassword(email, password);
    updateUI();
  } catch (e) {
    alert("Login fehlgeschlagen");
  }
}

// 🆕 Registrierung
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password
    });

    alert("Registriert! Jetzt einloggen.");
  } catch (e) {
    alert("Registrierung fehlgeschlagen");
  }
}

// 🚪 Logout
function logout() {
  pb.authStore.clear();
  updateUI();
}

// ⬆️ Foto upload
async function uploadPhoto() {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) return alert("Bitte Datei auswählen");

  const status = document.getElementById("uploadStatus");
  status.textContent = "⏳ Upload läuft…";

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  try {
    await pb.collection("photos").create(formData);

    status.textContent = "✅ Upload erfolgreich!";
    fileInput.value = "";
    loadPhotos();
  } catch (e) {
    console.error("Upload fehlgeschlagen:", e);
    status.textContent = "❌ Upload fehlgeschlagen";
  }
}

// 🖼️ Eigene Fotos laden
async function loadPhotos() {
  gallery.innerHTML = "";

  const photos = await pb.collection("photos").getFullList({
    sort: "-created"
  });

  console.log("Geladene Fotos:", photos);

  photos.forEach(p => {
    const img = document.createElement("img");
    img.src = pb.getFileUrl(p, p.image);
    img.title = "Zum Download: Rechtsklick";
    gallery.appendChild(img);
  });
}

// 🚀 Start
updateUI();
