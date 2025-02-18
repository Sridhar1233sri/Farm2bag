const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  username: { type: String, required: true },
  products: [
    {
      name: String,
      quantity: Number,
      price: Number,
      image: String,
    },
  ],
});

module.exports = mongoose.model("Cart", CartSchema);
