"use client";

import { useState } from "react";

// Dummy data
const conversations = [
    {
        id: "1",
        contactName: "Alice Smith",
        lastMessage: "Hey, do you have any availability for tomorrow?",
        timestamp: "10:30 AM",
        unread: true,
        avatar: "AS",
        messages: [
            { id: 1, sender: "them", text: "Hi, I need a plumber.", time: "10:28 AM" },
            { id: 2, sender: "me", text: "Sure, what seems to be the problem?", time: "10:29 AM" },
            { id: 3, sender: "them", text: "Hey, do you have any availability for tomorrow?", time: "10:30 AM" },
        ]
    },
    {
        id: "2",
        contactName: "Bob Jones",
        lastMessage: "Thanks for the quote.",
        timestamp: "Yesterday",
        unread: false,
        avatar: "BJ",
        messages: [
            { id: 1, sender: "me", text: "Here is the quote for the bathroom remodel.", time: "Yesterday" },
            { id: 2, sender: "them", text: "Thanks for the quote.", time: "Yesterday" },
        ]
    },
    {
        id: "3",
        contactName: "Charlie Brown",
        lastMessage: "Call me back please.",
        timestamp: "Mon",
        unread: false,
        avatar: "CB",
        messages: [
            { id: 1, sender: "them", text: "Call me back please.", time: "Mon" },
        ]
    },
];

export default function InboxPage() {
    const [selectedId, setSelectedId] = useState<string>("1");
    const selectedConversation = conversations.find(c => c.id === selectedId) || conversations[0];
    const [newMessage, setNewMessage] = useState("");

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            {/* Conversation List */}
            <div className="w-1/3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground">Inbox</h2>
                    <div className="mt-2 relative">
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedId(conv.id)}
                            className={`p-4 border-b border-zinc-100 dark:border-white/[0.05] cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors ${selectedId === conv.id ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""
                                }`}
                        >
                            <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${selectedId === conv.id
                                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10"
                                    }`}>
                                    {conv.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className={`text-sm font-semibold truncate ${conv.unread ? "text-foreground dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                                            {conv.contactName}
                                        </h3>
                                        <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">{conv.timestamp}</span>
                                    </div>
                                    <p className={`text-sm truncate ${conv.unread ? "text-foreground dark:text-white font-medium" : "text-zinc-500 dark:text-zinc-500"}`}>
                                        {conv.lastMessage}
                                    </p>
                                </div>
                                {conv.unread && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-2"></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-zinc-100 dark:border-white/[0.08] flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-200 dark:border-emerald-500/20">
                            {selectedConversation.avatar}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground">{selectedConversation.contactName}</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">+1 555 123 4567</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-50/30 dark:bg-black/20">
                    {selectedConversation.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "me"
                                    ? "bg-emerald-500 text-white rounded-br-none"
                                    : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-foreground dark:text-white rounded-bl-none"
                                }`}>
                                <p>{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.sender === "me" ? "text-emerald-100" : "text-zinc-400"
                                    }`}>{msg.time}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-zinc-100 dark:border-white/[0.08] bg-white dark:bg-zinc-900">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newMessage.trim()) {
                                    // Handle send (dummy)
                                    setNewMessage("");
                                }
                            }}
                        />
                        <button className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl transition-colors shadow-sm shadow-emerald-500/20 active:scale-95">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
