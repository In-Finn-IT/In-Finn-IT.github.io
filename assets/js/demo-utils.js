export function setStatus(el, msg, type = "info") {
  if (!el) return;
  el.textContent = msg;

  el.dataset.type = type; // "info" | "ok" | "error"
}

export function asNiceErrorMessage(err) {
  // PocketBase/network/unknown
  if (!err) return "Unbekannter Fehler.";

  // fetch/network errors
  if (err?.name === "TypeError") return "Netzwerkproblem. Bitte Verbindung prüfen.";

  const msg = err?.message || String(err);

  // PocketBase typische Fälle
  if (msg.includes("Failed to fetch")) return "Server nicht erreichbar. Bitte später erneut versuchen.";
  if (msg.includes("401")) return "Nicht eingeloggt oder Sitzung abgelaufen.";
  if (msg.includes("403")) return "Keine Berechtigung.";
  if (msg.includes("404")) return "Ressource nicht gefunden.";
  if (msg.includes("500")) return "Serverfehler. Bitte später erneut versuchen.";

  return "Fehler: " + msg;
}
