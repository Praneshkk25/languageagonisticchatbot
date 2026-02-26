"use client";

import { useState } from "react";
import "./globals.css";

export default function GeneralChatbotPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hello! I can help you with Fee Deadlines, Scholarship Forms, and Timetable queries. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages([...messages, { type: "user", text: input }]);
    const userQuery = input.toLowerCase();
    setInput("");

    // Simulate bot response (limited scope)
    setTimeout(() => {
      let response = "I'm sorry, I can only generic college queries without login.";

      if (userQuery.includes("fee")) {
        response = "The deadline for Semester Fees is Jan 31st, 2026. Late fee charges apply after this date.";
      } else if (userQuery.includes("scholarship")) {
        response = "Scholarship forms are available in the Admin block or can be downloaded from the 'Downloads' section.";
      } else if (userQuery.includes("timetable")) {
        response = "The timetable for the current semester was updated on Jan 15th. Check the notice board.";
      }

      setMessages(prev => [...prev, { type: "bot", text: response }]);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-slate-50 relative">
      {/* Mock College Website Context */}
      <header className="bg-slate-900 text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">City College of Engineering</h1>
          <nav className="space-x-4 text-sm">
            <a href="#" className="hover:text-sky-300">Home</a>
            <a href="#" className="hover:text-sky-300">Admissions</a>
            <a href="#" className="hover:text-sky-300">Departments</a>
            <a href="#" className="hover:text-sky-300">Contact</a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto p-12 text-center space-y-8">
        <h2 className="text-4xl font-bold text-slate-800">Welcome to CCE</h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Empowering minds, shaping futures. Join us for a world-class education experience.
        </p>
        <div className="h-64 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
          (Main Banner Image Placeholder)
        </div>
      </div>

      {/* Chatbot Widget */}
      <div className={`chatbot-widget ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}`}>
        <div className="chatbot-header cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <span>College Assist Bot</span>
          <span>{isOpen ? '−' : '+'}</span>
        </div>

        {isOpen && (
          <>
            <div className="chatbot-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="chatbot-input">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about fees, dates..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
