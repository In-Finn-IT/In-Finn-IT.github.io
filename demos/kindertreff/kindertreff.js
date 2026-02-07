// KINDERTREFF
import { setStatus, setBusy, safeFetch } from "/assets/js/demo-utils.js";

document.addEventListener("DOMContentLoaded", () => {

const pb = new PocketBase("/api");

/* User */
let uid = localStorage.getItem("kindertreffUser");
if(!uid){
  uid = crypto.randomUUID();
  localStorage.setItem("kindertreffUser", uid);
}

/* Hilfsfunktionen */
function normalizeDate(input){
  if(!input) return null;
  if(/\d{4}-\d{2}-\d{2}/.test(input)) return input;
  const parts = input.split(".");
  if(parts.length===3){
    const [dd,mm,yyyy] = parts;
    return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
  }
  return null;
}

function toDateInput(value) {
  if (!value) return "";
  // Datum kann "YYYY-MM-DD", "YYYY-MM-DD HH:MM" oder "YYYY-MM-DDTHH:MM:SSZ" sein
  return value.split("T")[0].split(" ")[0]; // immer nur YYYY-MM-DD
}


/* Woche */
const weekEl = document.getElementById("week");
const today = new Date(); today.setHours(0,0,0,0);
const days = {};

for(let i=0;i<7;i++){
  const d = new Date(today);
  d.setDate(today.getDate()+i);
  const key = d.toLocaleDateString("sv-SE");
  const div = document.createElement("div");
  div.className="day";
  div.dataset.date = key;
  div.innerHTML=`<h3>${i===0?"Heute":i===1?"Morgen":d.toLocaleDateString("de-DE",{weekday:"short"})}</h3><small>Keine Einträge</small>`;
  weekEl.appendChild(div);
  days[key]=div;
}

/* Laden */
async function loadEntries(){
  Object.values(days).forEach(d=>d.innerHTML=d.querySelector("h3").outerHTML+"<small>Keine Einträge</small>");

  const entries = await pb.collection("entries").getFullList({sort:"date,start"});

  /* ABGELAUFENE LÖSCHEN */
  const now = new Date();
  for (const e of entries) {
    const endTime = new Date(`${e.date}T${e.end}`);
    if (endTime < now) {
      await pb.collection("entries").delete(e.id);
    }
  }

  /* Anzeige */
  entries.forEach(e=>{
    const day = days[e.date?.split(" ")[0]];
    if(!day) return;
    day.querySelector("small")?.remove();

    const div = document.createElement("div");
    div.className="entry"+(e.createdBy===uid?" own":"");
    div.innerHTML=`<strong>${e.name}</strong><br>${e.start}–${e.end}<br><small>${e.group}${e.note?" · "+e.note:""}</small>`;

    if(e.createdBy===uid){
      const edit=document.createElement("button");
      edit.className="secondary";
      edit.textContent="Bearbeiten";
      edit.onclick = () => {
        document.getElementById("editId").value = e.id;
        document.getElementById("name").value = e.name;
        document.getElementById("group").value = e.group;
        document.getElementById("date").value = toDateInput(e.date);
        document.getElementById("start").value = e.start;
        document.getElementById("end").value = e.end;
        document.getElementById("note").value = e.note || "";

        document.getElementById("submitBtn").textContent = "Änderungen speichern";

        window.scrollTo({ top: 0, behavior: "smooth" });
      };


      const del=document.createElement("button");
      del.className="secondary";
      del.textContent="Löschen";
      del.onclick=async()=>{
        if(confirm("Eintrag wirklich löschen?")){
          await pb.collection("entries").delete(e.id);
          loadEntries();
        }
      };
      div.append(edit,del);
    }
    day.appendChild(div);
  });
}

/* Formular */
const form = document.getElementById("entryForm");
form.addEventListener("submit", async e=>{
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const group = document.getElementById("group").value;
  const date = normalizeDate(document.getElementById("date").value);
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const note = document.getElementById("note").value;

  if(!name){ alert("Bitte Name eingeben."); return;}
  if(!date){ alert("Datum fehlt oder ungültig."); return;}
  if(!start || !end){ alert("Bitte Start- und Endzeit angeben."); return;}

  const editId = document.getElementById("editId").value;

if (editId) {
  // ✏️ UPDATE
  await pb.collection("entries").update(editId, {
    name, group, date, start, end, note
  });
} else {
  // ➕ NEU
  await pb.collection("entries").create({
    name, group, date, start, end, note, createdBy: uid
  });
}

  form.reset();
  document.getElementById("editId").value = "";
  document.getElementById("submitBtn").textContent = "Speichern";
  loadEntries();
});

/* Init */
loadEntries();

});