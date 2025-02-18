const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/auth");
const searchRoutes = require("./routes/search");
const cartRoutes = require("./routes/cart"); 


const Search = require("./models/SearchHistory");
const router = express.Router();

// Save user search query
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

// Retrieve last 4 searches for a user
router.get("/recent/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const searches = await Search.find({ username })
      .sort({ searchedAt: -1 }) // Sort by newest first
      .limit(4) // Limit to last 4 searches
      .select("query -_id"); // Get only the query field

    res.json({ recentSearches: searches.map((s) => s.query) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});



dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on("connected", () => console.log("Connected to MongoDB"));

app.use("/auth", authRoutes);
app.use("/search", searchRoutes);
app.use("/cart", cartRoutes); 

app.listen(5000, () => console.log("Server running on port 5000"));
