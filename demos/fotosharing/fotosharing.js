//Fotosharing
import { setStatus, asNiceErrorMessage } from "/assets/js/demo-utils.js";

// 🔧 AUF SERVER:
const pb = new PocketBase("/api");

const authSection = document.getElementById("authSection");
const uploadSection = document.getElementById("uploadSection");
const gallery = document.getElementById("gallery");

const shareBtn = document.getElementById("btnShare");
const shareExpiry = document.getElementById("shareExpiry");
const shareLinkOut = document.getElementById("shareLinkOut");

const selectedPhotoIds = new Set();

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
  const status = document.getElementById("uploadStatus");

  if (!fileInput.files.length) {
    setStatus(status, "⚠️ Bitte zuerst eine Datei auswählen.", "error");
    return;
  }

  setStatus(status, "⏳ Upload läuft…", "info");

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);
  formData.append("owner", pb.authStore.model.id);

  try {
    await pb.collection("photos").create(formData);

    setStatus(status, "✅ Upload erfolgreich!", "ok");
    fileInput.value = "";
    loadPhotos();
  } catch (e) {
    console.error(e);
    setStatus(status, asNiceErrorMessage(e), "error");
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
  const wrap = document.createElement("div");
  wrap.className = "gallery-item";

  const topRow = document.createElement("div");
  topRow.className = "gallery-top";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "photo-select";
  cb.checked = selectedPhotoIds.has(p.id);
  cb.addEventListener("change", () => {
    if (cb.checked) selectedPhotoIds.add(p.id);
    else selectedPhotoIds.delete(p.id);
  });

  const img = document.createElement("img");
  img.src = pb.files.getURL(p, p.image);
  img.alt = "Upload";
  img.loading = "lazy";

  topRow.append(cb);
  wrap.append(topRow, img);

  gallery.appendChild(wrap);
});

}

// Freigabelink erstellen
async function createShareLink() {
  if (!pb.authStore.isValid) {
    setStatus(shareLinkOut, "⚠️ Bitte zuerst einloggen.", "error");
    return;
  }

  const ids = Array.from(selectedPhotoIds);
  if (ids.length === 0) {
    setStatus(shareLinkOut, "⚠️ Bitte mindestens ein Foto auswählen.", "error");
    return;
  }

  const days = parseInt(shareExpiry?.value || "7", 10);
  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  const token = crypto.randomUUID();

  setStatus(shareLinkOut, "⏳ Freigabe-Link wird erstellt…", "info");

  try {
    await pb.collection("shares").create({
      token,
      photos: ids,
      expiresAt: expires.toISOString(),
      createdBy: pb.authStore.model?.id || ""
    });

    const url = `${window.location.origin}/demos/fotosharing/share.html?t=${token}`;
    setStatus(shareLinkOut, `✅ Link erstellt: ${url}`, "ok");
  } catch (e) {
    setStatus(shareLinkOut, asNiceErrorMessage(e), "error");
  }
}


// Buttons verdrahten (statt onclick=...)
document.getElementById("btnLogin").addEventListener("click", login);
document.getElementById("btnRegister").addEventListener("click", register);
document.getElementById("btnUpload").addEventListener("click", uploadPhoto);
document.getElementById("btnLogout").addEventListener("click", logout);


shareBtn?.addEventListener("click", createShareLink);

// 🚀 Start
updateUI();


