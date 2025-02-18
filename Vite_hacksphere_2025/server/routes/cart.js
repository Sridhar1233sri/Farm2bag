const express = require("express");
const Cart = require("../models/Cart");
const router = express.Router();

// **Add to Cart**
router.post("/add", async (req, res) => {
  const { username, product } = req.body;

  try {
    let userCart = await Cart.findOne({ username });

    if (!userCart) {
      userCart = new Cart({ username, products: [product] });
    } else {
      const existingProduct = userCart.products.find((p) => p.name === product.name);
      if (existingProduct) {
        existingProduct.quantity += product.quantity;
      } else {
        userCart.products.push(product);
      }
    }

    await userCart.save();
    res.json({ message: "Product added to cart", cart: userCart });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// **Get User Cart**
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const userCart = await Cart.findOne({ username });

    if (!userCart) return res.status(404).json({ message: "Cart is empty" });

    res.json(userCart);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// **Clear Cart**
router.delete("/:username/clear", async (req, res) => {
  try {
    const { username } = req.params;
    await Cart.findOneAndDelete({ username });

    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// **Remove Specific Item from Cart**
router.delete("/:username/remove/:productName", async (req, res) => {
    try {
      const { username, productName } = req.params;
  
      let userCart = await Cart.findOne({ username });
      if (!userCart) return res.status(404).json({ message: "Cart not found" });
  
      // Filter out the item that needs to be removed
      userCart.products = userCart.products.filter((item) => item.name !== productName);
  
      // Save updated cart
      await userCart.save();
  
      res.json({ message: "Item removed from cart", cart: userCart });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });
  

module.exports = router;
