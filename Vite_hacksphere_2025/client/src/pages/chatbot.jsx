import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/chatbot.css"; // Import styles

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Toggle chatbot visibility
  const toggleChat = () => setIsOpen(!isOpen);

  // Handle user input
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const { data } = await axios.post("http://127.0.0.1:3000/chat", {
        query: input,
      });
      let formattedText = data.response
      .replace(/\n/g, "<br>") // Convert newlines to <br>
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g, '👉 <a href="$2" target="_blank">$1</a>')
      .replace(/(👈|👉|👆|👇)\s*(https?:\/\/[^\s]+)/g, (match, arrow, url) => {
        const productName = url.split("/").pop().replace(/[-_]/g, " "); // Extract last part of URL as name
        return `${arrow} <a href="${url}" target="_blank">${decodeURIComponent(productName)}</a>`;
      });

      const botMsg = { text: formattedText, sender: "bot" };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Error: Failed to get response", sender: "bot" },
      ]);
    }

    setInput("");
  };

  return (
    <>
      {/* Toggle Button */}
      <button className="toggle-chat" onClick={toggleChat}>
        {isOpen ? "Close Chat" : "Open Chat"}
      </button>

      {/* Chat Container */}
      <div className={`chat-container ${isOpen ? "open" : ""}`}>
        <div className="chat-header">
          Chat Assistant
          <button className="close-chat" onClick={toggleChat}>X</button>
        </div>
        <div className="chat-box" ref={chatRef}>
            {messages.map((msg, index) => (
            <div
             key={index}
            className={msg.sender === "user" ? "user-message" : "bot-message"}
             dangerouslySetInnerHTML={{ __html: msg.text }} // ✅ Renders links & line breaks correctly
            ></div>
         ))}
        </div>

        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
      </div>
    </>
  );
};

export default Chatbot;
