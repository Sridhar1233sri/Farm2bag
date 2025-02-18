import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Chatbot from "./chatbot";
import products from "./products";

const ProductList = () => {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const username = localStorage.getItem("username");

  // Fetch recommendations
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("http://localhost:5000/recommendations");
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  // Add to Cart function
  const addToCart = async (product) => {
    const username = localStorage.getItem("username");
    if (!username) {
      alert("Please log in first.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          product: { name: product.name, price: product.price, quantity: 1, image: product.image },
        }),
      });
  
      if (response.ok) {
        alert(`${product.name} added to cart!`);
      } else {
        alert("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };
  

  const filteredProducts = products.filter(
    (product) =>
      (category === "all" || product.category === category) &&
      product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="sidebar">
          <h3>Categories</h3>
          <button onClick={() => setCategory("all")}>All</button>
          <button onClick={() => setCategory("Fruit")}>Fruits</button>
          <button onClick={() => setCategory("Vegetable")}>Vegetables</button>
          <button onClick={() => setCategory("Dairy Products")}>Dairy</button>
          <button onClick={() => setCategory("Grocery")}>Groceries</button>
        </div>

        <div className="main-content">
          <div className="product-container">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <img src={product.image} alt={product.name} />
                  <h4>{product.name}</h4>
                  <p>₹{product.price}</p>
                  <button onClick={() => addToCart(product)}>Add to Cart</button>
                </div>
              ))
            ) : (
              <p>No products found!</p>
            )}
          </div>
        </div>
      </div>

      <Chatbot />
    </>
  );
};

export default ProductList;
