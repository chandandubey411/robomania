import React, { useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";


export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);

  const send = async () => {
    if (!msg) return;

    const userMsg = { from: "user", text: msg };
    setChat(c => [...c, userMsg]);
    setMsg("");

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:8080/api/chatbot/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ message: msg }),
    });

    const data = await res.json();

    setChat(c => [...c, { from: "bot", text: data.reply }]);
  };

  return (
    <>
    <div
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full cursor-pointer shadow-xl flex items-center justify-center text-2xl z-[10000]"
      >

        {open ? <FiX /> : <FiMessageCircle />}
      </div>


      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-white shadow-xl rounded-xl overflow-hidden z-[10000]">
          <div className="bg-blue-600 text-white p-3 font-semibold">
            Civic Assistant
          </div>

          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {chat.map((m, i) => (
              <div
                key={i}
                className={`text-sm ${
                  m.from === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block p-2 rounded ${
                    m.from === "user" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}
          </div>

          <div className="flex border-t">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              className="flex-1 p-2 outline-none"
              placeholder="Type message..."
            />
            <button onClick={send} className="bg-blue-600 text-white px-4">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
