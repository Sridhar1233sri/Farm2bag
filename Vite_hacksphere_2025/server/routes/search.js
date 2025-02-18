const express = require("express");
const Search = require("../models/SearchHistory");
const router = express.Router();

router.post("/save", async (req, res) => {
  try {
    const { username, query } = req.body;
    if (!username || !query) return res.status(400).json({ error: "Username and query are required" });

    const newSearch = new Search({ username, query });
    await newSearch.save();

    res.status(201).json({ message: "Search saved successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
