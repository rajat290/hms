import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

const initialMessage = {
  role: 'model',
  parts: [{ text: "Hello. I am MediFlow's assistant. Ask about symptoms, booking steps, or finding the right doctor." }],
};

const AIChatWidget = () => {
  const location = useLocation();
  const { backendUrl } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  if (['/login', '/reset-password', '/verify-email'].some((route) => location.pathname.startsWith(route))) {
    return null;
  }

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim() || isLoading) {
      return;
    }

    const userMessage = message.trim();
    const updatedHistory = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }];

    setMessage('');
    setChatHistory(updatedHistory);
    setIsLoading(true);

    try {
      const apiHistory = updatedHistory.filter((item, index) => !(index === 0 && item.role === 'model'));
      const { data } = await axios.post(`${backendUrl}/api/ai/chat`, {
        message: userMessage,
        chatHistory: apiHistory,
      });

      setChatHistory((current) => [
        ...current,
        {
          role: 'model',
          parts: [{ text: data.success ? data.message : 'The assistant is unavailable right now. Please try again shortly.' }],
        },
      ]);
    } catch (error) {
      setChatHistory((current) => [
        ...current,
        {
          role: 'model',
          parts: [{ text: error?.response?.data?.message || 'I could not connect just now. Please try again in a moment.' }],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[45] sm:bottom-8 sm:right-8">
      {isOpen ? (
        <div className="glass-panel absolute bottom-20 right-0 flex h-[560px] w-[min(92vw,400px)] flex-col overflow-hidden">
          <div className="bg-gradient-primary px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Virtual care assistant</p>
                <h3 className="mt-1 text-lg font-bold">Ask about symptoms or booking</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"
                aria-label="Close assistant"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f9fcfd_0%,#eef5f7_100%)] px-4 py-5">
            {chatHistory.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${
                    item.role === 'user'
                      ? 'rounded-br-md bg-secondary text-white'
                      : 'rounded-bl-md border border-white/90 bg-white text-slate-600'
                  }`}
                >
                  {item.parts[0].text}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-[22px] rounded-bl-md border border-white/90 bg-white px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-white/70 bg-white/80 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type your question..."
                className="app-input flex-1"
              />
              <button disabled={isLoading || !message.trim()} className="app-button disabled:cursor-not-allowed disabled:opacity-60">
                Send
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen((current) => !current)}
        className="float-card flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-white shadow-2xl shadow-primary/30"
        aria-label="Open assistant"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-7 6 2.2-2.2A2 2 0 0 1 9.6 17H18a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3v3Z" />
        </svg>
      </button>
    </div>
  );
};

export default AIChatWidget;
