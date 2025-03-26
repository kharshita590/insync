"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PendingRequest {
  from?: {
    _id: string;
    username: string;
  };
  _id: string;
  username?: string;
  customMessage: string;
  locationPreferences: string[];
  codeWord: string;
}

export default function PendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const { toast } = useToast();

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/chat", {
        headers: {
          "Authorization": `Bearer ${token}`,
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

  const acceptChatRequest = async (senderId: string) => {
    try {
      const response = await fetch("/api/chat/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ requesterId: senderId }),
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
          <div className="space-y-4">
            {pendingRequests.map((request, index) => {
              const senderUsername = request.from?.username || request.username || "Unknown";
              const senderId = request.from?._id || request._id;
              return (
                <div key={index} className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{senderUsername}</span>
                    <Button
                      size="sm"
                      onClick={() => acceptChatRequest(senderId)}
                    >
                      Accept
                    </Button>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm">
                      <strong>Message:</strong> {request.customMessage}
                    </p>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm">
                      <strong>Meeting Locations:</strong> {(request.locationPreferences || []).join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <strong>Code Word:</strong> {request.codeWord}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p>No pending requests</p>
      )}
    </div>
  );
}
