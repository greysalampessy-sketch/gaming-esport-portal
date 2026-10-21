const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const { search = "", platforms = "", page = "1", ordering = "" } = req.query;

    const response = await axios.get("https://api.rawg.io/api/games", {
      params: {
        key: process.env.RAWG_API_KEY,
        search: search || undefined,
        platforms: platforms || undefined,
        ordering: ordering || undefined,
        page: page || 1,
        page_size: 20,
      },
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("RAWG error:", error.response?.data || error.message);
    res.status(502).json({ error: "Gagal mengambil data game dari RAWG" });
  }
};
