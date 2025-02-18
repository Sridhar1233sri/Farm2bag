const mongoose = require("mongoose");

const SearchHistorySchema = new mongoose.Schema({
  username: { type: String, required: true },
  query: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SearchHistory", SearchHistorySchema);
