"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PendingRequest {
  _id: string;
  customMessage: string;
  locationPreferences: string[];
  codeWord: string;
  username?: string;
  from: string;
}

export default function PendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
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
    setAcceptingId(senderId); 
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
    } finally {
      setAcceptingId(null); 
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mt-6 mb-4">Pending Requests</h2>
      {pendingRequests.length > 0 ? (
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const senderId = request.from;
            const senderUsername = request.username || "Unknown Sender";
            return (
              <div
                key={request._id}
                className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{senderUsername}</span>
                  <Button
                    size="sm"
                    onClick={() => acceptChatRequest(senderId)}
                    disabled={acceptingId === senderId}
                  >
                    {acceptingId === senderId ? "Processing..." : "Accept"}
                  </Button>
                </div>
                <div className="mb-2">
                  <p className="text-sm">
                    <strong>Message:</strong> {request.customMessage}
                  </p>
                </div>
                <div className="mb-2">
                  <p className="text-sm">
                    <strong>Meeting Locations:</strong>{" "}
                    {(request.locationPreferences || []).join(", ")}
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
      ) : (
        <p>No pending requests</p>
      )}
    </div>
  );
}
