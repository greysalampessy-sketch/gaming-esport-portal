const API_BASE = "";
const FAV_KEY = "favoriteGames";

let currentPlatform = "";
let currentSearchTerm = "";
let currentSort = "";
let currentPage = 1;
let searchDebounce = null;

let currentGame = "lol";
let currentMatchStatus = "upcoming";
let currentTeamGame = "lol";

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || {}; }
  catch { return {}; }
}

function saveFavorites(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function toggleFavorite(game) {
  const favs = getFavorites();
  if (favs[game.id]) delete favs[game.id];
  else favs[game.id] = { id: game.id, name: game.name, background_image: game.background_image, rating: game.rating, released: game.released };
  saveFavorites(favs);
}

// ---------- TAB SWITCHING ----------
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById(`${tab}-view`).classList.add("active");

    if (tab === "favorites") renderFavorites();
    if (tab === "teams") loadTeams();
  });
});

// ---------- GAMES: SEARCH + FILTER + SORT ----------
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchDebounce);
  const value = e.target.value.trim();
  searchDebounce = setTimeout(() => {
    currentSearchTerm = value;
    currentPage = 1;
    loadGames(false);
  }, 450);
});

document.getElementById("sortSelect").addEventListener("change", (e) => {
  currentSort = e.target.value;
  currentPage = 1;
  loadGames(false);
});

document.querySelectorAll("#platformChips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#platformChips .chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentPlatform = chip.dataset.platform;
    currentPage = 1;
    loadGames(false);
  });
});

document.getElementById("loadMoreBtn").addEventListener("click", () => {
  currentPage += 1;
  loadGames(true);
});

function renderSkeletons(container, count) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "skeleton";
    container.appendChild(sk);
  }
}

function buildGameCard(game) {
  const favs = getFavorites();
  const isFav = !!favs[game.id];

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="thumb">
      <img src="${game.background_image || ""}" alt="${escapeHtml(game.name)}" loading="lazy" />
      <span class="rating-badge">★ ${game.rating ?? "-"}</span>
      <button class="fav-btn ${isFav ? "active" : ""}" title="Favorit">${isFav ? "❤️" : "🤍"}</button>
    </div>
    <div class="info">
      <h3>${escapeHtml(game.name)}</h3>
      <p>${game.released ? new Date(game.released).getFullYear() : "TBA"} · ${(game.genres || []).map(g => g.name).slice(0,2).join(", ") || "Game"}</p>
    </div>
  `;
  card.querySelector(".fav-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(game);
    const btn = e.currentTarget;
    const nowFav = !!getFavorites()[game.id];
    btn.classList.toggle("active", nowFav);
    btn.textContent = nowFav ? "❤️" : "🤍";
  });
  card.addEventListener("click", () => openGameModal(game.id));
  return card;
}

async function loadGames(append) {
  const status = document.getElementById("gamesStatus");
  const grid = document.getElementById("gamesGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (!append) {
    status.textContent = "Memuat data game...";
    renderSkeletons(grid, 8);
  } else {
    loadMoreBtn.textContent = "Memuat...";
    loadMoreBtn.disabled = true;
  }

  try {
    const params = new URLSearchParams();
    if (currentSearchTerm) params.set("search", currentSearchTerm);
    if (currentPlatform) params.set("platforms", currentPlatform);
    if (currentSort) params.set("ordering", currentSort);
    params.set("page", currentPage);

    const res = await fetch(`${API_BASE}/api/games?${params.toString()}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      if (!append) {
        grid.innerHTML = `<div class="empty-state"><div class="icon">🔍</div>Tidak ada game ditemukan untuk filter ini.</div>`;
      }
      status.textContent = "Tidak ada hasil tambahan.";
      loadMoreBtn.style.display = "none";
      return;
    }

    status.textContent = append
      ? `Menampilkan lebih banyak game (halaman ${currentPage})`
      : `Menampilkan ${data.results.length} game`;

    if (!append) grid.innerHTML = "";
    data.results.forEach((game) => grid.appendChild(buildGameCard(game)));

    loadMoreBtn.style.display = data.next ? "inline-block" : "none";
    loadMoreBtn.textContent = "Muat Lebih Banyak";
    loadMoreBtn.disabled = false;
  } catch (err) {
    status.textContent = "Gagal memuat data game.";
    if (!append) grid.innerHTML = "";
    console.error(err);
  }
}

// ---------- FAVORITES ----------
function renderFavorites() {
  const grid = document.getElementById("favoritesGrid");
  const status = document.getElementById("favoritesStatus");
  const favs = Object.values(getFavorites());

  if (favs.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">⭐</div>Belum ada game favorit. Klik ikon hati pada card game untuk menambahkan.</div>`;
    status.textContent = "";
    return;
  }

  status.textContent = `${favs.length} game favorit`;
  grid.innerHTML = "";
  favs.forEach((game) => grid.appendChild(buildGameCard(game)));
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

document.getElementById("modalClose").addEventListener("click", () => modal.classList.remove("active"));
modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.remove("active"); });

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

function renderMatchTeam(opponent, score, isWinner) {
  const name = opponent?.name || "TBD";
  const logo = opponent?.image_url || "";
  return `
    ${logo ? `<img src="${logo}" alt="${escapeHtml(name)}" />` : ""}
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
        <img src="${team.image_url || ""}" alt="${escapeHtml(team.name)}" onerror="this.style.display='none'" />
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

loadGames(false);
loadMatches();
