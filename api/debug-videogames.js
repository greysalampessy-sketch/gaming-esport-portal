const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const response = await axios.get("https://api.pandascore.co/videogames", {
      headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` },
      params: { per_page: 100 },
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(502).json({ error: error.response?.data || error.message });
  }
};
