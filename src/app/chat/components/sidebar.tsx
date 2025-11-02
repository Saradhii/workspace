"use client";

import { ArrowLeft, MessageSquarePlus, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  chats: { id: string; title: string; timestamp: Date }[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onBack: () => void;
}

export function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, onBack }: SidebarProps) {
  return (
    <div className="w-64 bg-[#111111] border-r border-gray-800 flex flex-col">
      {/* Top Section */}
      <div className="p-4 border-b border-gray-800">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={onNewChat}
          className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-gray-800"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              currentChatId === chat.id
                ? "bg-[#2a2a2a] text-white"
                : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
            }`}
          >
            <div className="font-medium truncate">{chat.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              {chat.timestamp.toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white"
        >
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white"
        >
          <User className="w-4 h-4 mr-3" />
          Profile
        </Button>
      </div>
    </div>
  );
}