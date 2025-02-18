import React, { useEffect, useState } from "react";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    fetchCart();
  }, [username]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`http://localhost:5000/cart/${username}`);
      const data = await response.json();
      setCartItems(data.products || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  // **Remove Item from Cart**
  const removeFromCart = async (productName) => {
    try {
      const response = await fetch(`http://localhost:5000/cart/${username}/remove/${productName}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCartItems(cartItems.filter((item) => item.name !== productName)); // Update UI
      } else {
        console.error("Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  return (
    <div>
      <h2>Your Cart</h2>
      {cartItems.length > 0 ? (
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              <img src={item.image} alt={item.name} width="50" />
              {item.name} - ₹{item.price} (Qty: {item.quantity})
              <button onClick={() => removeFromCart(item.name)}>Remove</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Your cart is empty</p>
      )}
    </div>
  );
};

export default CartPage;
