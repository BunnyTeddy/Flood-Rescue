import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Phone, User, Shield } from 'lucide-react';
import { ChatMessage, UserRole } from '../types';

interface ChatComponentProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
  currentUserRole: UserRole;
  recipientName: string;
  recipientPhone?: string;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  messages,
  onSendMessage,
  onClose,
  currentUserRole,
  recipientName,
  recipientPhone
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleCall = () => {
    if (recipientPhone) {
        window.location.href = `tel:${recipientPhone}`;
    } else {
        alert("Phone number not available.");
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${currentUserRole === UserRole.VICTIM ? 'bg-blue-600' : 'bg-red-600'}`}>
             {currentUserRole === UserRole.VICTIM ? <Shield size={20} className="text-white"/> : <User size={20} className="text-white"/>}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{recipientName}</h3>
            <div className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Active now
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleCall}
                className="p-3 bg-green-600/20 text-green-500 rounded-full hover:bg-green-600/30 transition"
            >
                <Phone size={20} />
            </button>
            <button 
                onClick={onClose}
                className="p-3 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 transition"
            >
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
        {messages.length === 0 && (
            <div className="text-center text-slate-600 mt-10 text-sm">
                Start coordinating with {recipientName}...
            </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderRole === currentUserRole;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}
              >
                {msg.text}
                <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-3 text-white outline-none focus:border-blue-500 transition"
        />
        <button
          type="submit"
          className="p-3 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-500 transition disabled:opacity-50"
          disabled={!inputText.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};