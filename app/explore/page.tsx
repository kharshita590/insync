"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserCircle } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  bio: string;
  interests: string[];
}

export default function Explore() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }
  
      const response = await fetch('/api/users/suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
  
      const data = await response.json();
      setUsers(data.users);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleChatRequest = async (userId: string) => {
    try {
      const response = await fetch('/api/chat/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send chat request');
      }

      toast({
        title: "Success",
        description: "Chat request sent!",
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
    <div className="min-h-screen bg-gradient-to-r from-pink-400 to-purple-500 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Discover New Friends
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4 mb-4">
                <UserCircle className="w-12 h-12 text-gray-400" />
                <div>
                  <h2 className="text-xl font-semibold">{user.username}</h2>
                  <p className="text-sm text-gray-600">
                    {user.interests.join(', ')}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{user.bio}</p>

              <Button
                onClick={() => handleChatRequest(user._id)}
                className="w-full"
              >
                Send Chat Request
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}