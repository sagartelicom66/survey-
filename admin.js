import {
  auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  getAllResponses, updateSurveyStatus, getSurveyStatus, setWinnerDelay,
  saveWinner, getWinners, getEligibleParticipants
} from "./firebase.js";

let allResponses = [];
let spinInterval = null;
let spinParticipants = [];
let currentSpinPick = null;
let prizeIndex = 0;
const prizes = ["🥇 ₹99", "🥈 ₹49"];

// ── Auth ──────────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  if (user) { showApp(); loadAll(); }
  else { document.getElementById("login-wrap").style.display = "flex"; document.getElementById("admin-app").style.display = "none"; }
});

document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value.trim();
  const pass = document.getElementById("admin-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    document.getElementById("login-error").textContent = "Invalid credentials.";
  }
});

document.getElementById("btn-logout").addEventListener("click", () => signOut(auth));

function showApp() {
  document.getElementById("login-wrap").style.display = "none";
  document.getElementById("admin-app").style.display = "block";
}

// ── Load All ──────────────────────────────────────────────────────────────────
async function loadAll() {
  allResponses = await getAllResponses();
  renderStats();
  renderTable(allResponses);
  renderWinners();
  const status = await getSurveyStatus();
  const st = status.status || "active";
  document.getElementById("stat-status").textContent = st.charAt(0).toUpperCase() + st.slice(1);
  renderStatusBadge(st);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function renderStats() {
  document.getElementById("stat-total").textContent = allResponses.length;
  const mobiles = new Set(allResponses.map(r => r.mobile));
  document.getElementById("stat-unique").textContent = mobiles.size;
  const last = allResponses.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))[0];
  document.getElementById("stat-last").textContent = last?.timestamp ? new Date(last.timestamp.seconds * 1000).toLocaleTimeString() : "–";
}

function renderStatusBadge(status) {
  const map = { active: ["status-active", "● Active"], paused: ["status-paused", "⏸ Paused"], stopped: ["status-stopped", "⏹ Stopped"] };
  const [cls, label] = map[status] || ["status-active", status];
  document.getElementById("current-status").innerHTML = `Status: <span class="status-badge ${cls}">${label}</span>`;
}

async function refreshStatus() {
  const s = await getSurveyStatus();
  const st = s.status || "active";
  document.getElementById("stat-status").textContent = st.charAt(0).toUpperCase() + st.slice(1);
  renderStatusBadge(st);
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable(rows) {
  const tbody = document.getElementById("responses-tbody");
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><code>${r.participantId || "–"}</code></td>
      <td>${r.name || "–"}</td>
      <td>${r.mobile || "–"}</td>
      <td>${r.village || "–"}</td>
      <td>${r.ageGroup || "–"}</td>
      <td>${r.language || "–"}</td>
      <td>${r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleString() : "–"}</td>
      <td><button class="btn-view" onclick="showDetail('${r.participantId}')">View</button></td>
    </tr>`).join("");
}

// ── Search / Filter ───────────────────────────────────────────────────────────
function applyFilters() {
  const q = document.getElementById("search-input").value.toLowerCase();
  const age = document.getElementById("filter-age").value;
  let filtered = allResponses;
  if (q) filtered = filtered.filter(r =>
    (r.name || "").toLowerCase().includes(q) ||
    (r.mobile || "").includes(q) ||
    (r.village || "").toLowerCase().includes(q));
  if (age) filtered = filtered.filter(r => r.ageGroup === age);
  renderTable(filtered);
}
document.getElementById("search-input").addEventListener("input", applyFilters);
document.getElementById("filter-age").addEventListener("change", applyFilters);

// ── Detail Modal ──────────────────────────────────────────────────────────────
window.showDetail = function(id) {
  const r = allResponses.find(x => x.participantId === id);
  if (!r) return;
  const skip = ["participantId", "timestamp", "language"];
  const html = Object.entries(r).filter(([k]) => !skip.includes(k)).map(([k, v]) =>
    `<div class="answer-row"><strong>${k}:</strong> ${Array.isArray(v) ? v.join(", ") : v || "–"}</div>`
  ).join("");
  document.getElementById("modal-content").innerHTML = `<div class="answer-row"><strong>ID:</strong> ${r.participantId}</div>` + html;
  document.getElementById("modal-overlay").classList.add("open");
};
document.getElementById("modal-close").addEventListener("click", () =>
  document.getElementById("modal-overlay").classList.remove("open"));
document.getElementById("modal-overlay").addEventListener("click", e => {
  if (e.target === document.getElementById("modal-overlay"))
    document.getElementById("modal-overlay").classList.remove("open");
});

// ── Export CSV ────────────────────────────────────────────────────────────────
document.getElementById("btn-export").addEventListener("click", () => {
  if (!allResponses.length) return;
  const keys = [...new Set(allResponses.flatMap(r => Object.keys(r)))];
  const rows = [keys.join(","), ...allResponses.map(r =>
    keys.map(k => `"${(Array.isArray(r[k]) ? r[k].join(";") : r[k] || "").toString().replace(/"/g, '""')}"`).join(",")
  )];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "survey_responses.csv"; a.click();
});

// ── Survey Control ────────────────────────────────────────────────────────────
document.getElementById("btn-start-survey").addEventListener("click", async () => {
  await updateSurveyStatus("active"); refreshStatus();
});
document.getElementById("btn-pause-survey").addEventListener("click", async () => {
  await updateSurveyStatus("paused"); refreshStatus();
});
document.getElementById("btn-stop-survey").addEventListener("click", async () => {
  if (!confirm("Stop the survey? No new responses will be accepted.")) return;
  await updateSurveyStatus("stopped"); refreshStatus();
});

// ── Tabs ──────────────────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ── Lucky Draw Delay ──────────────────────────────────────────────────────────
document.querySelectorAll(".delay-set").forEach(btn => {
  btn.addEventListener("click", async () => {
    await setWinnerDelay(parseInt(btn.dataset.min));
    alert(`Winner announcement set for ${btn.dataset.min} minutes from now.`);
  });
});
document.getElementById("btn-custom-delay").addEventListener("click", () => {
  const w = document.getElementById("custom-delay-wrap");
  w.style.display = w.style.display === "none" ? "block" : "none";
});
document.getElementById("btn-set-custom").addEventListener("click", async () => {
  const mins = parseInt(document.getElementById("custom-delay-input").value);
  if (!mins || mins < 1) return alert("Enter valid minutes.");
  await setWinnerDelay(mins);
  alert(`Winner announcement set for ${mins} minutes from now.`);
});

// ── Spin ──────────────────────────────────────────────────────────────────────
document.getElementById("btn-spin").addEventListener("click", async () => {
  if (spinInterval) { clearInterval(spinInterval); spinInterval = null; document.getElementById("btn-spin").textContent = "🎰 Start Spin"; return; }
  spinParticipants = await getEligibleParticipants();
  if (!spinParticipants.length) { alert("No eligible participants."); return; }
  document.getElementById("btn-spin").textContent = "⏹ Stop Spin";
  document.getElementById("btn-pick-winner").disabled = false;
  let i = 0;
  spinInterval = setInterval(() => {
    const p = spinParticipants[i % spinParticipants.length];
    document.getElementById("spin-name").textContent = p.name || p.participantId;
    document.getElementById("spin-id").textContent = p.participantId;
    currentSpinPick = p;
    i++;
  }, 80);
});

document.getElementById("btn-pick-winner").addEventListener("click", async () => {
  if (!currentSpinPick) return;
  clearInterval(spinInterval); spinInterval = null;
  document.getElementById("btn-spin").textContent = "🎰 Start Spin";
  document.getElementById("btn-pick-winner").disabled = true;
  const prize = prizes[prizeIndex] || "Prize";
  await saveWinner({ ...currentSpinPick, prize, wonAt: new Date().toISOString() });
  prizeIndex++;
  currentSpinPick = null;
  renderWinners();
  document.getElementById("spin-name").textContent = "–";
  document.getElementById("spin-id").textContent = "";
});

async function renderWinners() {
  const winners = await getWinners();
  const list = document.getElementById("winners-list");
  list.innerHTML = winners.length ? winners.map(w => `
    <div class="winner-item">
      <strong>${w.prize}</strong> – ${w.name || "–"} (${w.participantId})<br/>
      <span class="muted">📱 ${w.mobile || "–"}</span>
    </div>`).join("") : `<p class="muted">No winners yet.</p>`;
}
