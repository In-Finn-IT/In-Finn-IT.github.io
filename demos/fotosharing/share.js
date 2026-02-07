import { setStatus, asNiceErrorMessage } from "/assets/js/demo-utils.js";

// Server: PocketBase hinter /api
const pb = new PocketBase("/api");

const statusEl = document.getElementById("shareStatus");
const gallery = document.getElementById("gallery");
const meta = document.getElementById("shareMeta");

function getToken() {
  const url = new URL(window.location.href);
  return url.searchParams.get("t")?.trim() || "";
}

function renderGallery(photos) {
  gallery.innerHTML = "";

  photos.forEach((p) => {
    const wrap = document.createElement("div");
    wrap.className = "gallery-item";

    const img = document.createElement("img");
    img.src = pb.files.getURL(p, p.image);
    img.alt = "Foto";
    img.loading = "lazy";

    const a = document.createElement("a");
    a.className = "btn btn-secondary";
    a.textContent = "Download";
    a.href = pb.files.getURL(p, p.image);
    a.download = "";
    a.target = "_blank";
    a.rel = "noopener";

    wrap.append(img, a);
    gallery.appendChild(wrap);
  });
}

async function main() {
  const token = getToken();
  if (!token) {
    setStatus(statusEl, "❌ Kein Freigabe-Token gefunden.", "error");
    return;
  }

  setStatus(statusEl, "⏳ Freigabe wird geladen…", "info");

  try {
    // Wichtig: getFirstListItem nutzt LIST endpoint + filter
    // Deine List-Rule sollte token/expiry prüfen (siehe oben).
    const share = await pb
      .collection("shares")
      .getFirstListItem(`token="${token}"`);

    const exp = new Date(share.expiresAt);
    const now = new Date();

    if (Number.isNaN(exp.getTime()) || exp <= now) {
      setStatus(statusEl, "⛔ Diese Freigabe ist abgelaufen.", "error");
      return;
    }

    meta.textContent = `Gültig bis: ${exp.toLocaleString("de-DE")}`;

    // Fotos laden
    const ids = share.photos || [];
    if (!ids.length) {
      setStatus(statusEl, "⚠️ Keine Fotos in dieser Freigabe.", "error");
      return;
    }

    // getFullList + filter nach ids
    const filter = ids.map((id) => `id="${id}"`).join(" || ");
    const photos = await pb.collection("photos").getFullList({ filter, sort: "-created" });

    renderGallery(photos);
    setStatus(statusEl, "✅ Freigabe aktiv.", "ok");
  } catch (e) {
    setStatus(statusEl, asNiceErrorMessage(e), "error");
  }
}

main();
