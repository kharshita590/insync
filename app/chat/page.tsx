"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatUser {
  _id: string;
  username: string;
}

export default function ChatPage() {
  const { toast } = useToast();
  const [activeChats, setActiveChats] = useState<ChatUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ChatUser[]>([]);

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chat", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch chats");
      const data = await response.json();
      setActiveChats(data.activeChats || []);
      setPendingRequests(data.pendingRequests || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Active Chats</h2>
      <div className="space-y-2">
        {activeChats.map((chat) => (
          <Card key={chat._id} className="p-2">
            <div className="flex items-center">
              <span>{chat.username}</span>
            </div>
          </Card>
        ))}
      </div>
   
    </div>
  );
}
