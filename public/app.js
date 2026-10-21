const API_BASE = "";

let currentPlatform = "";
let currentSearchTerm = "";
let searchDebounce = null;

let currentGame = "lol";
let currentMatchStatus = "upcoming";

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// ---------- TAB SWITCHING ----------
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById(`${tab}-view`).classList.add("active");
  });
});

// ---------- GAMES: SEARCH + FILTER ----------
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchDebounce);
  const value = e.target.value.trim();
  searchDebounce = setTimeout(() => {
    currentSearchTerm = value;
    loadGames();
  }, 450);
});

document.querySelectorAll("#platformChips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#platformChips .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentPlatform = chip.dataset.platform;
    loadGames();
  });
});

function renderSkeletons(container, count) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "skeleton";
    container.appendChild(sk);
  }
}

async function loadGames() {
  const status = document.getElementById("gamesStatus");
  const grid = document.getElementById("gamesGrid");
  status.textContent = "Memuat data game...";
  renderSkeletons(grid, 8);

  try {
    const params = new URLSearchParams();
    if (currentSearchTerm) params.set("search", currentSearchTerm);
    if (currentPlatform) params.set("platforms", currentPlatform);

    const res = await fetch(`${API_BASE}/api/games?${params.toString()}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      grid.innerHTML = "";
      status.textContent = "Tidak ada game ditemukan untuk filter ini.";
      return;
    }

    status.textContent = `Menampilkan ${data.results.length} game`;
    grid.innerHTML = "";

    data.results.forEach((game) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="thumb">
          <img src="${game.background_image || ""}" alt="${escapeHtml(game.name)}" loading="lazy" />
          <span class="rating-badge">★ ${game.rating ?? "-"}</span>
        </div>
        <div class="info">
          <h3>${escapeHtml(game.name)}</h3>
          <p>${game.released ? new Date(game.released).getFullYear() : "TBA"} · ${(game.genres || []).map(g => g.name).slice(0,2).join(", ") || "Game"}</p>
        </div>
      `;
      card.addEventListener("click", () => openGameModal(game.id));
      grid.appendChild(card);
    });
  } catch (err) {
    status.textContent = "Gagal memuat data game.";
    grid.innerHTML = "";
    console.error(err);
  }
}

// ---------- GAME DETAIL MODAL ----------
const modal = document.getElementById("gameModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalRating = document.getElementById("modalRating");
const modalReleased = document.getElementById("modalReleased");
const modalPlatforms = document.getElementById("modalPlatforms");
const modalDescription = document.getElementById("modalDescription");

async function openGameModal(id) {
  modal.classList.add("active");
  modalTitle.textContent = "Memuat...";
  modalImage.src = "";
  modalRating.textContent = "-";
  modalReleased.textContent = "-";
  modalPlatforms.textContent = "-";
  modalDescription.textContent = "Memuat deskripsi...";

  try {
    const res = await fetch(`${API_BASE}/api/games/${id}`);
    const game = await res.json();

    modalImage.src = game.background_image || "";
    modalTitle.textContent = game.name || "Tanpa nama";
    modalRating.textContent = `${game.rating ?? "-"} / 5`;
    modalReleased.textContent = game.released || "TBA";
    modalPlatforms.textContent = (game.platforms || []).map(p => p.platform.name).join(", ") || "-";

    const desc = (game.description_raw || "Tidak ada deskripsi tersedia.").slice(0, 500);
    modalDescription.textContent = desc + (game.description_raw && game.description_raw.length > 500 ? "..." : "");
  } catch (err) {
    modalTitle.textContent = "Gagal memuat detail";
    modalDescription.textContent = "";
    console.error(err);
  }
}

document.getElementById("modalClose").addEventListener("click", () => {
  modal.classList.remove("active");
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("active");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.classList.remove("active");
});

// ---------- ESPORTS ----------
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

async function loadMatches() {
  const status = document.getElementById("matchesStatus");
  const list = document.getElementById("matchesList");
  status.textContent = "Memuat jadwal pertandingan...";
  list.innerHTML = "";

  try {
    const url = `${API_BASE}/api/esports/matches/${currentGame}?status=${currentMatchStatus}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      status.textContent = "Tidak ada pertandingan untuk kategori ini.";
      return;
    }

    status.textContent = `${data.length} pertandingan ditemukan`;

    data.forEach((match) => {
      const opponentA = match.opponents?.[0]?.opponent;
      const opponentB = match.opponents?.[1]?.opponent;
      const teamA = opponentA?.name || "TBD";
      const teamB = opponentB?.name || "TBD";
      const logoA = opponentA?.image_url || "";
      const logoB = opponentB?.image_url || "";
      const isLive = currentMatchStatus === "running";

      const date = match.begin_at
        ? new Date(match.begin_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
        : "Jadwal belum ditentukan";

      const row = document.createElement("div");
      row.className = "match-card";
      row.innerHTML = `
        <div class="match-teams">
          ${logoA ? `<img src="${logoA}" alt="${escapeHtml(teamA)}" />` : ""}
          <span>${escapeHtml(teamA)}</span>
          <span class="vs">vs</span>
          ${logoB ? `<img src="${logoB}" alt="${escapeHtml(teamB)}" />` : ""}
          <span>${escapeHtml(teamB)}</span>
          ${isLive ? '<span class="live-badge">LIVE</span>' : ""}
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
    console.error(err);
  }
}

loadGames();
loadMatches();
