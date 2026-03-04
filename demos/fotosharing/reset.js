// /demos/fotosharing/reset.js
import { setStatus, asNiceErrorMessage } from "/assets/js/demo-utils.js";

const pb = new PocketBase("/");

const btnReset = document.getElementById("btnReset");
const statusEl = document.getElementById("resetStatus");
const pw1El = document.getElementById("newPassword");
const pw2El = document.getElementById("newPassword2");

function getToken() {
  const params = new URLSearchParams(window.location.search);
  // je nach Template kann der Parameter token=... oder t=... heißen
  return (params.get("token") || params.get("t") || "").trim();
}

function disableForm() {
  if (btnReset) btnReset.disabled = true;
  if (pw1El) pw1El.disabled = true;
  if (pw2El) pw2El.disabled = true;
}

function enableForm() {
  if (btnReset) btnReset.disabled = false;
  if (pw1El) pw1El.disabled = false;
  if (pw2El) pw2El.disabled = false;
}

function clearPasswords() {
  if (pw1El) pw1El.value = "";
  if (pw2El) pw2El.value = "";
}

async function doReset() {
  const token = getToken();
  if (!token) {
    setStatus(statusEl, "⚠️ Token fehlt im Link. Bitte den Reset-Link vollständig öffnen.", "error");
    return;
  }

  const pw1 = (pw1El?.value || "").trim();
  const pw2 = (pw2El?.value || "").trim();

  if (pw1.length < 8) {
    setStatus(statusEl, "⚠️ Passwort muss mindestens 8 Zeichen lang sein.", "error");
    return;
  }

  if (pw1 !== pw2) {
    setStatus(statusEl, "⚠️ Passwörter stimmen nicht überein.", "error");
    return;
  }

  setStatus(statusEl, "⏳ Setze neues Passwort…", "info");
  disableForm();

  try {
    // Standard: normale Nutzer
    await pb.collection("users").confirmPasswordReset(token, pw1, pw2);

    clearPasswords();
    setStatus(statusEl, "✅ Passwort geändert. Bitte jetzt mit dem neuen Passwort einloggen.", "ok");

    // kontrollierter Rücksprung zur Demo (dort leeren wir das Passwortfeld via ?reset=1)
    setTimeout(() => {
      window.location.href = "/demos/fotosharing/projekt-fotosharing-demo.html?reset=1";
    }, 1200);
  } catch (e1) {
    // Falls der Token doch von _superusers kommt: als Fallback versuchen
    try {
      await pb.collection("_superusers").confirmPasswordReset(token, pw1, pw2);

      clearPasswords();
      setStatus(statusEl, "✅ Admin-Passwort geändert. Bitte jetzt neu einloggen.", "ok");

      setTimeout(() => {
        window.location.href = "/_/"; // Admin UI
      }, 1200);
    } catch (e2) {
      console.error("RESET ERROR users:", e1);
      console.error("RESET ERROR superusers:", e2);

      enableForm();
      setStatus(statusEl, asNiceErrorMessage(e1), "error");
    }
  }
}

btnReset?.addEventListener("click", doReset);
