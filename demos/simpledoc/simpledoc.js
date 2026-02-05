// SIMPLEDOC

  const form = document.getElementById("simpledoc-form");
  const output = document.getElementById("notes-output");

  form.addEventListener("submit", function (e) {
  e.preventDefault();

  const timestamp = new Date().toLocaleString("de-DE", {
    dateStyle: "short",
    timeStyle: "short"
  });

  const ref = form.ref.value.trim();
  const date = form.date.value;
  const type = form.type.value;
  const notes = form.notes.value;

  const statuses = [...form.querySelectorAll('input[name="status"]:checked')]
    .map(cb => cb.value);

  const hints = [...form.querySelectorAll('input[name="hint"]:checked')]
    .map(cb => cb.value);

  const entry = document.createElement("div");
  entry.className = "note-card";

  entry.innerHTML = `
    <div class="note-header">
      <strong>${ref || "ohne Kennung"}</strong>
      <span>${type}</span>
    </div>
    <strong>${date}</strong><br>
    <em>Status:</em> ${statuses.join(", ") || "—"}<br>
    <em>Hinweise:</em> ${hints.join(", ") || "—"}<br>
    ${notes ? `<em>Notiz:</em> ${notes}<br>` : ""}
    <small>erstellt am ${timestamp}</small>
  `;

  output.prepend(entry);
  form.reset();
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

});

  
  document.getElementById("add-status").addEventListener("click", () => {
  const text = document.getElementById("new-status").value.trim();
  if (!text) return;

  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" name="status" value="${text}"> ${text}`;

  document.querySelector(".checkbox-group").appendChild(label);
  document.getElementById("new-status").value = "";
});