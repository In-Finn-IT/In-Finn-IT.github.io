// fotosharing.js
import { setStatus, asNiceErrorMessage } from "/assets/js/demo-utils.js";

// 🔧 AUF SERVER:
const pb = new PocketBase("/");

// Sections / UI
const authSection = document.getElementById("authSection");
const uploadSection = document.getElementById("uploadSection");
const gallery = document.getElementById("gallery");
const authStatus = document.getElementById("authStatus");

// Share UI 
const btnShareAll = document.getElementById("btnShareAll");
const shareResult = document.getElementById("shareResult");
const shareLink = document.getElementById("shareLink");
const btnCopyShare = document.getElementById("btnCopyShare");
const shareHint = document.getElementById("shareHint");

// 🔁 UI wechseln
function updateUI() {
  if (pb.authStore.isValid) {
    authSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    loadPhotos();
    if (authStatus) setStatus(authStatus, "", "info");
  } else {
    authSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
    if (authStatus) setStatus(authStatus, "", "info");
  }
}

// 🔐 Login
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (authStatus) setStatus(authStatus, "⏳ Login läuft…", "info");

  try {
    await pb.collection("users").authWithPassword(email, password);
    updateUI();
  } catch (e) {
    if (authStatus) setStatus(authStatus, asNiceErrorMessage(e), "error");
  }
}

// 🆕 Registrierung
async function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (authStatus) setStatus(authStatus, "⏳ Registrierung läuft…", "info");

  try {
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password,
    });

    if (authStatus) setStatus(authStatus, "✅ Registriert. Jetzt einloggen.", "ok");
  } catch (e) {
    if (authStatus) setStatus(authStatus, asNiceErrorMessage(e), "error");
  }
}

// 🚪 Logout
function logout() {
  pb.authStore.clear();
  updateUI();

  // Share UI zurücksetzen
  if (shareResult) shareResult.classList.add("hidden");
  if (shareLink) shareLink.value = "";
  if (shareHint) setStatus(shareHint, "", "info");
}

// ⬆️ Foto upload
async function uploadPhoto() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("uploadStatus");

  if (!fileInput.files.length) {
    setStatus(status, "⚠️ Bitte zuerst eine Datei auswählen.", "error");
    return;
  }

  if (!pb.authStore.isValid) {
    setStatus(status, "⚠️ Bitte zuerst einloggen.", "error");
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

  try {
    const photos = await pb.collection("photos").getFullList({
      sort: "-created",
    });

    if (photos.length === 0) {
      gallery.innerHTML = `<p class="hint">Noch keine Fotos hochgeladen.</p>`;
      return;
    }

    photos.forEach((p) => {
      const img = document.createElement("img");
      img.src = pb.files.getURL(p, p.image);
      img.alt = "Upload";
      img.loading = "lazy";
      img.title = "Zum Download: Rechtsklick";
      gallery.appendChild(img);
    });
  } catch (e) {
    console.error(e);
    gallery.innerHTML = `<p class="hint">Fotos konnten nicht geladen werden.</p>`;
  }
}

// 🔗 Freigabelink für ALLE Fotos erstellen
async function createShareAllLink() {
  if (!pb.authStore.isValid) {
    if (shareHint) setStatus(shareHint, "⚠️ Bitte zuerst einloggen.", "error");
    return;
  }

  if (shareResult) shareResult.classList.add("hidden");
  if (shareHint) setStatus(shareHint, "⏳ Freigabelink wird erstellt…", "info");

  try {
    // Alle Fotos holen (IDs)
    const photos = await pb.collection("photos").getFullList({ sort: "-created" });
    const ids = photos.map((p) => p.id);

    if (ids.length === 0) {
      if (shareHint) setStatus(shareHint, "⚠️ Keine Fotos vorhanden.", "error");
      return;
    }

    // Ablauf: erstmal fix 7 Tage (später UI dafür ergänzen)
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const token = crypto.randomUUID();

    await pb.collection("shares").create({
      token,
      photo: ids,
      expiresAt: expires.toISOString(),
      createdBy: pb.authStore.model?.id || "",
    });

    const url = `${window.location.origin}/demos/fotosharing/share.html?t=${token}`;

    if (shareLink) shareLink.value = url;
    if (shareResult) shareResult.classList.remove("hidden");
    if (shareHint) setStatus(shareHint, "✅ Link erstellt (7 Tage gültig).", "ok");
  } catch (e) {
    if (shareHint) setStatus(shareHint, asNiceErrorMessage(e), "error");
  }
}

// 📋 Copy
async function copyShareLink() {
  const url = shareLink?.value?.trim();
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    if (shareHint) setStatus(shareHint, "✅ Kopiert.", "ok");
  } catch {
    // Fallback: markieren
    shareLink.focus();
    shareLink.select();
    if (shareHint) setStatus(shareHint, "⚠️ Konnte nicht automatisch kopieren – Link ist markiert.", "error");
  }
}

// Buttons verdrahten
document.getElementById("btnLogin")?.addEventListener("click", login);
document.getElementById("btnRegister")?.addEventListener("click", register);
document.getElementById("btnUpload")?.addEventListener("click", uploadPhoto);
document.getElementById("btnLogout")?.addEventListener("click", logout);

btnShareAll?.addEventListener("click", createShareAllLink);
btnCopyShare?.addEventListener("click", copyShareLink);

// 🚀 Start
updateUI();


