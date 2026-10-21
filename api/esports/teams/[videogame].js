const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const { videogame } = req.query;

    const response = await axios.get(
      `https://api.pandascore.co/${videogame}/teams`,
      {
        headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` },
        params: { per_page: 20 },
      }
    );

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("PandaScore teams error:", error.response?.data || error.message);
    res.status(502).json({ error: "Gagal mengambil data tim esport" });
  }
};
