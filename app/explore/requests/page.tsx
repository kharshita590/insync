"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatUser {
  _id: string;
  username: string;
}

export default function PendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<ChatUser[]>([]);
  const { toast } = useToast();
  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chat", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      const data = await response.json();
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
  const acceptChatRequest = async (userId: string) => {
    try {
      const response = await fetch("/api/chat/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ requesterId: userId }),
      });
      if (!response.ok) throw new Error("Failed to accept chat request");

      await fetchChats();

      toast({
        title: "Success",
        description: "Chat request accepted",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="p-4">
      {pendingRequests.length > 0 ? (
        <>
          <h2 className="text-xl font-bold mt-6 mb-4">Pending Requests</h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request._id} className="flex items-center space-x-2">
                <span>{request.username}</span>
                <Button
                  size="sm"
                  onClick={() => acceptChatRequest(request._id)}
                >
                  Accept
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>No pending requests</p>
      )}
    </div>
  );
}
