const API_BASE = "";
const THEME_KEY = "esportSgaTheme";

let currentGame = "mlbb";
let currentMatchStatus = "upcoming";
let currentTeamGame = "mlbb";

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ---------- DARK MODE ----------
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

const savedTheme = localStorage.getItem(THEME_KEY)
  || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// ---------- TAB SWITCHING ----------
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById(`${tab}-view`).classList.add("active");

    if (tab === "teams") loadTeams();
  });
});

// ---------- ESPORTS: MATCHES ----------
document.querySelectorAll("#gamePills .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#gamePills .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentGame = chip.dataset.game;
    loadMatches();
  });
});

document.querySelectorAll("#statusPills .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#statusPills .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentMatchStatus = chip.dataset.status;
    loadMatches();
  });
});

function renderTeamLogo(opponent, sizeClass) {
  const name = opponent?.name || "TBD";
  const logo = opponent?.image_url;
  const initials = getInitials(name);

  if (!logo) {
    return `<span class="${sizeClass === "lg" ? "team-avatar-lg" : "team-avatar"}">${initials}</span>`;
  }

  const imgClass = sizeClass === "lg" ? "team-logo-lg" : "team-logo";
  const fallbackClass = sizeClass === "lg" ? "team-avatar-lg" : "team-avatar";
  const uid = `fallback-${Math.random().toString(36).slice(2, 9)}`;

  return `
    <span class="${imgClass}" style="display:inline-flex;align-items:center;justify-content:center;overflow:hidden;">
      <img src="${logo}" alt="${escapeHtml(name)}" class="${imgClass}"
        style="width:100%;height:100%;object-fit:cover;"
        onerror="this.closest('span').outerHTML = document.getElementById('${uid}').innerHTML;" />
    </span>
    <template id="${uid}"><span class="${fallbackClass}">${initials}</span></template>
  `;
}

function renderMatchTeam(opponent, score, isWinner) {
  const name = opponent?.name || "TBD";
  return `
    ${renderTeamLogo(opponent, "sm")}
    <span>${escapeHtml(name)}</span>
    ${score !== null && score !== undefined ? `<span class="team-score">${score}</span>` : ""}
    ${isWinner ? '<span class="winner-badge">MENANG</span>' : ""}
  `;
}

async function loadMatches() {
  const status = document.getElementById("matchesStatus");
  const list = document.getElementById("matchesList");
  status.textContent = "Memuat data pertandingan...";
  list.innerHTML = "";

  try {
    const url = `${API_BASE}/api/esports/matches/${currentGame}?status=${currentMatchStatus}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="icon">🏆</div>Tidak ada pertandingan untuk kategori ini.</div>`;
      status.textContent = "";
      return;
    }

    status.textContent = `${data.length} pertandingan ditemukan`;

    data.forEach((match) => {
      const opponentA = match.opponents?.[0]?.opponent;
      const opponentB = match.opponents?.[1]?.opponent;

      const resultA = match.results?.find(r => r.team_id === opponentA?.id);
      const resultB = match.results?.find(r => r.team_id === opponentB?.id);
      const scoreA = resultA ? resultA.score : null;
      const scoreB = resultB ? resultB.score : null;

      const winnerId = match.winner_id;
      const isLive = currentMatchStatus === "running";
      const isPast = currentMatchStatus === "past";

      const date = match.begin_at
        ? new Date(match.begin_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
        : "Jadwal belum ditentukan";

      const row = document.createElement("div");
      row.className = "match-card";
      row.innerHTML = `
        <div class="match-teams">
          ${renderMatchTeam(opponentA, isPast || isLive ? scoreA : null, isPast && winnerId === opponentA?.id)}
          <span class="vs">${isPast || isLive ? '<span class="score-divider">:</span>' : "vs"}</span>
          ${renderMatchTeam(opponentB, isPast || isLive ? scoreB : null, isPast && winnerId === opponentB?.id)}
          ${isLive ? '<span class="live-badge">● LIVE</span>' : ""}
        </div>
        <div class="match-meta">
          <div>${escapeHtml(match.league?.name || "")}</div>
          <div>${date}</div>
        </div>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    status.textContent = "Gagal memuat jadwal pertandingan.";
    list.innerHTML = "";
    console.error(err);
  }
}

// ---------- ESPORTS: TEAMS ----------
document.querySelectorAll("#teamGamePills .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#teamGamePills .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentTeamGame = chip.dataset.game;
    loadTeams();
  });
});

async function loadTeams() {
  const status = document.getElementById("teamsStatus");
  const grid = document.getElementById("teamsGrid");
  status.textContent = "Memuat daftar tim...";
  grid.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/esports/teams/${currentTeamGame}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">🛡️</div>Tidak ada data tim untuk game ini.</div>`;
      status.textContent = "";
      return;
    }

    status.textContent = `${data.length} tim ditemukan`;

    data.forEach((team) => {
      const card = document.createElement("div");
      card.className = "team-card";
      card.innerHTML = `
        ${renderTeamLogo(team, "lg")}
        <h4>${escapeHtml(team.name || "Tanpa nama")}</h4>
        <p>${escapeHtml(team.location || team.acronym || "")}</p>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    status.textContent = "Gagal memuat daftar tim.";
    grid.innerHTML = "";
    console.error(err);
  }
}

loadMatches();
