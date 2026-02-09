import { setStatus, asNiceErrorMessage } from "/assets/js/demo-utils.js";

const statusEl = document.getElementById("shareStatus");
const galleryEl = document.getElementById("shareGallery");
const metaEl = document.getElementById("shareMeta"); // optional

function getToken() {
  return new URL(window.location.href).searchParams.get("t")?.trim() || "";
}

function render(photos) {
  galleryEl.innerHTML = "";

  if (!photos.length) {
    galleryEl.innerHTML = `<p class="hint">Keine Fotos in dieser Freigabe.</p>`;
    return;
  }

  photos.forEach((p) => {
    const wrap = document.createElement("div");
    wrap.className = "gallery-item";

    const img = document.createElement("img");
    // WICHTIG: Datei-URL geht weiterhin über /api/files/...
    img.src = `/api/files/photos/${p.id}/${p.image}`;
    img.alt = "Foto";
    img.loading = "lazy";

    const a = document.createElement("a");
    a.className = "btn btn-secondary";
    a.textContent = "Download";
    a.href = img.src;
    a.setAttribute("download", "");

    wrap.append(img, a);
    galleryEl.appendChild(wrap);
  });
}

async function main() {
  const token = getToken();
  if (!token) {
    setStatus(statusEl, "❌ Ungültiger Link (Token fehlt).", "error");
    return;
  }

  setStatus(statusEl, "⏳ Freigabe wird geladen…", "info");

  try {
    const res = await fetch(`/api/shared-photos?t=${encodeURIComponent(token)}`);

const raw = await res.text(); // <-- statt res.json()

if (!res.ok) {
  if (res.status === 410) throw new Error("Diese Freigabe ist abgelaufen.");
  if (res.status === 404) throw new Error("Freigabe nicht gefunden.");
  throw new Error(`Freigabe konnte nicht geladen werden. (${res.status})`);
}

if (!raw.trim()) {
  throw new Error("API hat 200 geliefert, aber ohne Inhalt (leere Antwort).");
}

let data;
try {
  data = JSON.parse(raw);
} catch {
  throw new Error("API hat keine gültige JSON geliefert.");
}

if (metaEl && data.expiresAt) {
  const exp = new Date(data.expiresAt);
  metaEl.textContent = `Gültig bis: ${exp.toLocaleString("de-DE")}`;
}

render(data.photos || []);
setStatus(statusEl, "✅ Freigabe aktiv.", "ok");

  } catch (e) {
    setStatus(statusEl, asNiceErrorMessage(e), "error");
  }
}

main();
