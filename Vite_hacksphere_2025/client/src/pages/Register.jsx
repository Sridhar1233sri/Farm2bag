import { useState } from "react";
import axios from "axios";
import "../styles/register.css";

function Register() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/auth/register", formData);
      localStorage.setItem("username", formData.username); 
      window.location.href = "/home";
    } catch (err) {
      alert("Error: " + err.response.data.message);
    }
  };

  return (<div><br/><br/>
    <form onSubmit={handleSubmit}>
      <input type="text" name="username" placeholder="Username" onChange={handleChange} /><br/>
      <input type="email" name="email" placeholder="Email" onChange={handleChange} /><br/>
      <input type="password" name="password" placeholder="Password" onChange={handleChange} /><br/>
      <button type="submit">Register</button><br/>
      <button onClick={() => window.location.href = "/login"}>Login</button>
    </form></div>
  );
}

export default Register;
