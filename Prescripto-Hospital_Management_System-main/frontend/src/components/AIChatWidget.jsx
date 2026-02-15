import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';

const AIChatWidget = () => {
    const { backendUrl } = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', parts: [{ text: "Hello! I'm Mediflow's AI Assistant. How can I help you with your health concerns today?" }] }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');
        setIsLoading(true);

        // Update local history
        const newHistory = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }];
        setChatHistory(newHistory);

        try {
            // Filter history to remove the initial assistant greeting before sending to API
            const apiHistory = chatHistory.filter(item => item.role !== 'model' || chatHistory.indexOf(item) !== 0);

            const { data } = await axios.post(`${backendUrl}/api/ai/chat`, {
                message: userMessage,
                chatHistory: apiHistory
            });

            if (data.success) {
                setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: data.message }] }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "I'm having trouble connecting. Please try again later." }] }]);
            }
        } catch (error) {
            console.error(error);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "Disconnected. Please check your internet connection." }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 sm:bottom-10 right-6 z-[999]">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-primary p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 animate-pulse">
                                <span className="text-xl">🤖</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm">Mediflow AI</p>
                                <p className="text-[10px] text-blue-100">Ready to assist you</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {chatHistory.map((item, idx) => (
                            <div key={idx} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${item.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                                    }`}>
                                    {item.parts[0].text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask about symptoms, doctors..."
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                        <button
                            disabled={isLoading || !message.trim()}
                            className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:scale-95 active:scale-90"
                        >
                            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-90 relative ${isOpen ? 'bg-gray-100 text-primary rotate-90' : 'bg-primary text-white shadow-primary/40'
                    }`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                    <div className="relative">
                        <span className="text-3xl">🤖</span>
                        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary rounded-full animate-ping"></div>
                    </div>
                )}
            </button>
        </div>
    );
};

export default AIChatWidget;
