const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    const response = await axios.get(`https://api.rawg.io/api/games/${id}`, {
      params: { key: process.env.RAWG_API_KEY },
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("RAWG detail error:", error.response?.data || error.message);
    res.status(502).json({ error: "Gagal mengambil detail game" });
  }
};
