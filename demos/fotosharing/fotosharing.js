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
const shareResult = document.getElementById("shareResult");
const shareLink = document.getElementById("shareLink");
const btnCopyShare = document.getElementById("btnCopyShare");
const shareHint = document.getElementById("shareHint");
const btnShareSelected = document.getElementById("btnShareSelected");
const btnClearSelection = document.getElementById("btnClearSelection");
const selectionInfo = document.getElementById("selectionInfo");
const sharesCount = document.getElementById("sharesCount");
const expiresDays = document.getElementById("expiresDays");

// Shares Verwaltung UI
const sharesSection = document.getElementById("sharesSection");
const sharesList = document.getElementById("sharesList");
const sharesStatus = document.getElementById("sharesStatus");
const btnReloadShares = document.getElementById("btnReloadShares");
const btnToggleExpired = document.getElementById("btnToggleExpired");
const btnOpenShare = document.getElementById("btnOpenShare");

const selectedPhotoIds = new Set();

let showExpiredShares = false;
let lastShareUrl = "";

// ---------- Helper ----------
function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "";
  return d.toLocaleString("de-DE");
}

function isExpired(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? true : d <= new Date();
}

function buildShareUrl(token) {
  return `${window.location.origin}/demos/fotosharing/share.html?t=${encodeURIComponent(token)}`;
}

function clearSharesUI() {
  if (sharesList) sharesList.innerHTML = "";
  if (sharesStatus) setStatus(sharesStatus, "", "info");
}

function updateSelectionUI() {
  const n = selectedPhotoIds.size;

  if (selectionInfo) selectionInfo.textContent = `${n} ausgewählt`;
  if (btnShareSelected) btnShareSelected.disabled = n === 0;
  if (btnClearSelection) btnClearSelection.disabled = n === 0;
}


// 🔁 UI wechseln
function updateUI() {
  if (pb.authStore.isValid) {
    authSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    loadPhotos();
    loadShares();
    if (authStatus) setStatus(authStatus, "", "info");
  } else {
    authSection.classList.remove("hidden");
    uploadSection.classList.add("hidden");
    clearSharesUI();
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
    console.error(e);

    const fieldErrors = e?.data?.data || {};
    if (fieldErrors?.password) {
      setStatus(authStatus, "⚠️ Passwort muss mindestens 8 Zeichen lang sein.", "error");
      return;
    }

    setStatus(authStatus, asNiceErrorMessage(e), "error");
  }
}

// 🚪 Logout
function logout() {
  pb.authStore.clear();
  lastShareUrl = "";
  selectedPhotoIds.clear();

  updateUI(); 

  // Share UI zurücksetzen
  if (shareResult) shareResult.classList.add("hidden");
  if (shareLink) shareLink.value = "";
  if (shareHint) setStatus(shareHint, "", "info");

  
  updateSelectionUI();

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

  const userId = pb.authStore.model?.id;
  if (!userId) {
    setStatus(status, "⚠️ Login-Status ungültig. Bitte neu einloggen.", "error");
    return;
  }

      // Demo-Limit: max 20 Fotos pro Benutzer (Frontend-Check)
      try {
        const existing = await pb.collection("photos").getFullList({
          filter: `owner = "${userId}"`,
          fields: "id",
        });

        if (existing.length >= 20) {
          setStatus(status, "⚠️ Demo-Limit erreicht: maximal 20 Fotos pro Benutzer.", "error");
          return;
        }
      } catch (err) {
        // Falls der Check fehlschlägt: Upload nicht blockieren, nur loggen
        console.log("PB error status:", e?.status);
        console.log("PB error message:", e?.message);
        console.log("PB error data:", e?.data);
        console.error("Could not check photo limit:", err);
      }

  const file = fileInput.files[0];

  // gleiche Grenze wie im Backend (hier 20 MB) – bitte passend zu deinem PB-Feld setzen
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    setStatus(
      status,
      `⚠️ Datei zu groß. Bitte maximal ${Math.round(maxSize / 1024 / 1024)} MB hochladen.`,
      "error"
    );
    return;
  }

      // Demo-Limit: max 20 Fotos pro User (Frontend-Check)
      try {
        const existing = await pb.collection("photos").getFullList({
          filter: `owner = "${userId}"`,
          fields: "id",
        });

        if (existing.length >= 20) {
          setStatus(status, "⚠️ Demo-Limit erreicht: maximal 20 Fotos pro Benutzer.", "error");
          return;
        }
      } catch (e) {
        // Falls Laden fehlschlägt: Upload nicht blocken, nur loggen
        console.error("Could not check photo limit:", e);
      }

  setStatus(status, "⏳ Upload läuft…", "info");

  const formData = new FormData();
  formData.append("image", file);
  formData.append("owner", userId);

  try {
    const created = await pb.collection("photos").create(formData);
    console.log("CREATED PHOTO RECORD:", created);

    setStatus(status, "✅ Upload erfolgreich!", "ok");
    fileInput.value = "";
    loadPhotos();
  } catch (e) {
    console.error("UPLOAD ERROR:", e);

    const code = e?.data?.data?.image?.code;
    if (code === "validation_file_size_limit") {
      const max = e?.data?.data?.image?.params?.maxSize;
      const mb = max ? Math.round(max / 1024 / 1024) : 5;
      setStatus(status, `⚠️ Datei zu groß. Maximal ${mb} MB.`, "error");
      return;
    }

    setStatus(status, asNiceErrorMessage(e), "error");
  }
}

// 🖼️ Eigene Fotos laden
async function loadPhotos() {
  gallery.innerHTML = "";

  if (!pb.authStore.isValid) {
    gallery.innerHTML = `<p class="hint">Bitte einloggen.</p>`;
    return;
  }

  const userId = pb.authStore.model?.id;
  if (!userId) {
    gallery.innerHTML = `<p class="hint">Login-Status ungültig. Bitte neu einloggen.</p>`;
    return;
  }

  try {
    const photos = await pb.collection("photos").getFullList({
      sort: "-created",
      filter: `owner = "${userId}"`,
    });

    if (photos.length === 0) {
      gallery.innerHTML = `<p class="hint">Noch keine Fotos hochgeladen.</p>`;
      updateSelectionUI();
      return;
    }

    photos.forEach((p) => {
      const wrapper = document.createElement("div");
      wrapper.className = "photo-item";

      const img = document.createElement("img");
      img.src = pb.files.getURL(p, p.image);
      img.alt = "Upload";
      img.loading = "lazy";
      img.title = "Klicken = auswählen";

      // Wenn bereits ausgewählt → visuell markieren
      if (selectedPhotoIds.has(p.id)) {
        wrapper.classList.add("is-selected");
      }

      const badge = document.createElement("div");
      badge.className = "photo-badge";
      badge.textContent = "Ausgewählt";
      badge.style.display = selectedPhotoIds.has(p.id) ? "block" : "none";

      img.addEventListener("click", () => {
        if (selectedPhotoIds.has(p.id)) {
          selectedPhotoIds.delete(p.id);
          wrapper.classList.remove("is-selected");
          badge.style.display = "none";
        } else {
          selectedPhotoIds.add(p.id);
          wrapper.classList.add("is-selected");
          badge.style.display = "block";
        }
        updateSelectionUI();
      });

      // 🔘 Actions als kleine Icons im Bild
      const actions = document.createElement("div");
      actions.className = "photo-actions";

      // ❌ Delete
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "photo-action-icon";
      btnDelete.title = "Löschen";
      btnDelete.textContent = "✕";

      btnDelete.addEventListener("click", async (e) => {
        e.stopPropagation(); // verhindert Auswahl-Toggle
        const ok = confirm("Foto wirklich löschen?");
        if (!ok) return;

        try {
          await pb.collection("photos").delete(p.id);
          selectedPhotoIds.delete(p.id);
          loadPhotos();
        } catch (err) {
          console.error(err);
          alert("Foto konnte nicht gelöscht werden.");
        }
      });

      // ⬇ Download
      const btnDownload = document.createElement("button");
      btnDownload.type = "button";
      btnDownload.className = "photo-action-icon";
      btnDownload.title = "Download";
      btnDownload.textContent = "⬇";

      btnDownload.addEventListener("click", (e) => {
        e.stopPropagation(); // verhindert Auswahl-Toggle
        const url = pb.files.getURL(p, p.image);
        const a = document.createElement("a");
        a.href = url;
        a.download = p.image || "photo";
        document.body.appendChild(a);
        a.click();
        a.remove();
      });

      actions.appendChild(btnDelete);
      actions.appendChild(btnDownload);

      wrapper.appendChild(img);
      wrapper.appendChild(badge);
      wrapper.appendChild(actions);
      gallery.appendChild(wrapper);
    });

    updateSelectionUI();
  } catch (e) {
    console.error(e);
    gallery.innerHTML = `<p class="hint">Fotos konnten nicht geladen werden.</p>`;
    updateSelectionUI();
  }
}

async function createShareSelectedLink() {
  if (!pb.authStore.isValid) {
    if (shareHint) setStatus(shareHint, "⚠️ Bitte zuerst einloggen.", "error");
    return;
  }

  const userId = pb.authStore.model?.id;
  if (!userId) {
    if (shareHint) setStatus(shareHint, "⚠️ Login-Status ungültig. Bitte neu einloggen.", "error");
    return;
  }

  const ids = Array.from(selectedPhotoIds);
  if (ids.length === 0) {
    if (shareHint) setStatus(shareHint, "⚠️ Bitte zuerst Fotos auswählen.", "error");
    return;
  }

  if (shareResult) shareResult.classList.add("hidden");
  if (shareHint) setStatus(shareHint, `⏳ Erstelle Link für ${ids.length} Bild(er)…`, "info");

  selectedPhotoIds.clear();
  updateSelectionUI();
  loadPhotos();

  try {
    const days = Number(expiresDays?.value || 7);
    const safeDays = Number.isFinite(days) && days > 0 ? days : 7;

    const expires = new Date();
    expires.setDate(expires.getDate() + safeDays);

    const token = crypto.randomUUID();

    await pb.collection("shares").create({
      token,
      photo: ids,
      expiresAt: expires.toISOString(),
      // createdBy wird serverseitig gesetzt
    });

    const url = buildShareUrl(token);

    lastShareUrl = url;
    if (shareResult) shareResult.classList.remove("hidden");
    if (shareHint) setStatus(shareHint, `✅ Link erstellt (${ids.length} Bild(er), ${safeDays} Tag(e) gültig).`, "ok");

    loadShares();
  } catch (e) {
    console.error(e);

    if (e?.status === 403) {
      pb.authStore.clear();
      updateUI();
      if (shareHint) setStatus(shareHint, "⚠️ Sitzung abgelaufen. Bitte neu einloggen.", "error");
      return;
    }

    if (shareHint) setStatus(shareHint, asNiceErrorMessage(e), "error");
  }
}


// 📋 Copy
async function copyShareLink() {
  const url = (lastShareUrl || "").trim();
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    if (shareHint) setStatus(shareHint, "✅ Link kopiert.", "ok");
  } catch {
    if (shareHint) setStatus(shareHint, "⚠️ Konnte nicht automatisch kopieren.", "error");
  }
}

// 📌 Shares laden (alle eigenen – über Rules begrenzt)
async function loadShares() {
  if (!sharesList) return;

  if (!pb.authStore.isValid) {
    if (sharesList) sharesList.innerHTML = "";
    if (sharesStatus) setStatus(sharesStatus, "", "info");
    if (sharesCount) sharesCount.textContent = "";
    return;
  }

  sharesList.innerHTML = `<p class="hint">⏳ Lädt…</p>`;
  if (sharesStatus) setStatus(sharesStatus, "", "info");

  try {
    const shares = await pb.collection("shares").getFullList({
      sort: "-created",
    });

    const filtered = showExpiredShares
        ? shares
        : shares.filter((s) => !isExpired(s.expiresAt));

      if (sharesCount) sharesCount.textContent = `(${filtered.length})`;

      if (!filtered.length) {
        sharesList.innerHTML = `<p class="hint">Noch keine Freigaben.</p>`;
        return;
      }

      sharesList.innerHTML = "";

    filtered.forEach((s) => {
      const url = buildShareUrl(s.token);
      const exp = s.expiresAt;
      const expired = isExpired(exp);
      const count = Array.isArray(s.photo) ? s.photo.length : 0;

      const item = document.createElement("div");
      item.className = "share-item";

      item.innerHTML = `
        <div class="share-line">
          <strong>${expired ? "⛔ Abgelaufen" : "✅ Aktiv"}</strong>
          <span class="muted">• Fotos: ${count}</span>
          <span class="muted">• bis ${formatDateTime(exp)}</span>
        </div>

        <div class="share-line">
          <input type="text" class="share-url" value="${url}" readonly />
        </div>

        <div class="share-actions">
          <button type="button" class="btnCopy btn-secondary">Kopieren</button>
          <button type="button" class="btnDelete btn-secondary">Löschen</button>
        </div>
      `;

      item.querySelector(".btnCopy")?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(url);
          if (sharesStatus) setStatus(sharesStatus, "✅ Link kopiert.", "ok");
        } catch {
          const inp = item.querySelector(".share-url");
          inp?.focus();
          inp?.select();
          if (sharesStatus) {
            setStatus(sharesStatus, "⚠️ Konnte nicht automatisch kopieren – Link ist markiert.", "error");
          }
        }
      });

      item.querySelector(".btnDelete")?.addEventListener("click", async () => {
        const ok = confirm("Freigabe wirklich löschen?");
        if (!ok) return;

        try {
          await pb.collection("shares").delete(s.id);
          if (sharesStatus) setStatus(sharesStatus, "✅ Freigabe gelöscht.", "ok");
          loadShares();
        } catch (e) {
          console.error(e);
          if (sharesStatus) setStatus(sharesStatus, asNiceErrorMessage(e), "error");
        }
      });

      sharesList.appendChild(item);
    });
  } catch (e) {
    console.error(e);
    sharesList.innerHTML = `<p class="hint">Freigaben konnten nicht geladen werden.</p>`;
    if (sharesStatus) setStatus(sharesStatus, asNiceErrorMessage(e), "error");
    if (sharesCount) sharesCount.textContent = "";
  }
}

// Buttons verdrahten
document.getElementById("btnLogin")?.addEventListener("click", login);
document.getElementById("btnRegister")?.addEventListener("click", register);
document.getElementById("btnUpload")?.addEventListener("click", uploadPhoto);
document.getElementById("btnLogout")?.addEventListener("click", logout);

btnCopyShare?.addEventListener("click", copyShareLink);

btnReloadShares?.addEventListener("click", loadShares);
btnShareSelected?.addEventListener("click", createShareSelectedLink);

btnClearSelection?.addEventListener("click", () => {
  selectedPhotoIds.clear();
  updateSelectionUI();
  loadPhotos(); // damit Rahmen/Badges weg sind
});

btnToggleExpired?.addEventListener("click", () => {
  showExpiredShares = !showExpiredShares;
  btnToggleExpired.textContent = showExpiredShares ? "Abgelaufene ausblenden" : "Abgelaufene anzeigen";
  loadShares();
});

btnOpenShare?.addEventListener("click", () => {
  if (!lastShareUrl) return;
  window.open(lastShareUrl, "_blank", "noopener");
});

// 🚀 Start
updateUI();
updateSelectionUI();





