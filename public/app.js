const API_BASE = ""; // kosong karena frontend & API 1 domain di Vercel

async function loadGames(search = "") {
  const status = document.getElementById("gamesStatus");
  const grid = document.getElementById("gamesGrid");
  status.textContent = "Memuat data game...";
  grid.innerHTML = "";

  try {
    const url = `${API_BASE}/api/games${search ? `?search=${encodeURIComponent(search)}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      status.textContent = "Tidak ada game ditemukan.";
      return;
    }

    status.textContent = "";
    data.results.forEach((game) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${game.background_image || ""}" alt="${game.name}" />
        <div class="info">
          <h3>${game.name}</h3>
          <p>Rating: ${game.rating ?? "-"} / 5</p>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    status.textContent = "Gagal memuat data game.";
    console.error(err);
  }
}

async function loadMatches(videogame = "lol") {
  const status = document.getElementById("matchesStatus");
  const list = document.getElementById("matchesList");
  status.textContent = "Memuat jadwal pertandingan...";
  list.innerHTML = "";

  try {
    const url = `${API_BASE}/api/esports/matches/${videogame}?status=upcoming`;
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      status.textContent = "Tidak ada jadwal pertandingan mendatang.";
      return;
    }

    status.textContent = "";
    data.forEach((match) => {
      const row = document.createElement("div");
      row.className = "match-row";
      const teamA = match.opponents?.[0]?.opponent?.name || "TBD";
      const teamB = match.opponents?.[1]?.opponent?.name || "TBD";
      const date = match.begin_at
        ? new Date(match.begin_at).toLocaleString("id-ID")
        : "Jadwal belum ditentukan";
      row.innerHTML = `<span>${teamA} vs ${teamB}</span><span>${date}</span>`;
      list.appendChild(row);
    });
  } catch (err) {
    status.textContent = "Gagal memuat jadwal pertandingan.";
    console.error(err);
  }
}

document.getElementById("searchBtn").addEventListener("click", () => {
  const value = document.getElementById("searchInput").value.trim();
  loadGames(value);
});

document.getElementById("gameSelect").addEventListener("change", (e) => {
  loadMatches(e.target.value);
});

loadGames();
loadMatches();
