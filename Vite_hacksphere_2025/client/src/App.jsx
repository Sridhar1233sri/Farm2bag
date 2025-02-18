import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/ProductList";
import Navbar from "./pages/Navbar";
import Homepage from "./pages/homepage";
import Chatbot from "./pages/chatbot";
import CartPage from "./pages/cartpage";
import "./App.css";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/navbar" element={<Navbar />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Homepage />} />
      </Routes>
    </Router>
  );
}

export default App;
