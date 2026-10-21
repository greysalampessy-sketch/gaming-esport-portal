const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const { videogame } = req.query;
    const status = req.query.status || "upcoming";

    const response = await axios.get(
      `https://api.pandascore.co/${videogame}/matches/${status}`,
      {
        headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` },
        params: { per_page: 15 },
      }
    );

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("PandaScore error:", error.response?.data || error.message);
    res.status(502).json({ error: "Gagal mengambil data pertandingan esport" });
  }
};
