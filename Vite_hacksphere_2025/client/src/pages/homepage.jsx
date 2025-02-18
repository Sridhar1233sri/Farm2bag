import React, { useState, useEffect } from "react";
import ProductList from "./ProductList";

import "../styles/homepagesstyles.css";

const Homepage = () => {
  const [search, setSearch] = useState("");
  const [recommendations, setRecommendations] = useState([]); 
  const username = localStorage.getItem("username"); 

  const handleSearch = async () => {
    if (!username || !search) {
      console.error("Username not found in localStorage or search query is empty");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: search }), 
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations); // Store recommendations in state
        document.getElementById("res").innerHTML = `Search saved for ${username}`;
        document.getElementById("res").style.display = "block";
        setTimeout(() => {
          document.getElementById("res").style.display = "none";
        }, 1000);
      } else {
        console.error("Error saving search");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <div>
      <h1>Welcome to Farm2Bag</h1>

      <input 
        type="text" 
        placeholder="Enter search query" 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
      /><br />
      <button onClick={handleSearch}>Search</button><br />
      <div id="res"></div><br/>

      {/* Display Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3>Recommended Products</h3>
          <ul>
            {recommendations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <ProductList />
    </div>
  );
};

export default Homepage;
