const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const response = await axios.get("https://api.pandascore.co/videogames", {
      headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` },
      params: { per_page: 100 },
    });
    const simplified = response.data.map(g => ({ id: g.id, name: g.name, slug: g.slug }));
    res.status(200).json(simplified);
  } catch (error) {
    res.status(502).json({ error: error.response?.data || error.message });
  }
};
