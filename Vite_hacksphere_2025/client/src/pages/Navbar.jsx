import React from "react";
import { FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  return (
    <nav className="navbar">
      <div className="logo">Farm2Bag</div>
      <ul className="nav-links">
        <li><a href="/home">Home</a></li>
        <li><a href="/about">About Us</a></li>
      </ul>
      <div className="nav-actions">
        {username ? (
          <>
            <span className="username">{username}</span>
            <button className="nav-btn" onClick={() => {
              localStorage.removeItem("username");
              navigate("/");
            }}>Logout</button>
          </>
        ) : (
          <>
            <button className="nav-btn" onClick={() => navigate("/signup")}>Sign Up</button>
            <button className="nav-btn" onClick={() => navigate("/login")}>Login</button>
          </>
        )}
        <div className="cart-icon" onClick={() => navigate("/cart")}>
          <FaShoppingCart size={24} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
