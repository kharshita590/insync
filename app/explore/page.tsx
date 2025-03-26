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
  gender:string[];
}

export default function Explore() {
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState("");
  const [codeWord, setCodeWord] = useState("");
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const preferenceOptions = ["Cafeteria", "Library", "Hungry Nights", "Big Treat Only"];

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

  const openRequestModal = (user: User) => {
    setSelectedUser(user);
    setMessageText("");
    setCodeWord("");
    setSelectedPreferences([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handlePreferenceChange = (preference: string) => {
    if (selectedPreferences.includes(preference)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== preference));
    } else {
      setSelectedPreferences([...selectedPreferences, preference]);
    }
  };

  const handleSubmitRequest = async () => {
    const wordCount = messageText.trim().split(/\s+/).length;
    console.log(selectedUser)
    if (wordCount > 30) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Message must be between 30 and 40 words.",
      });
      return;
    }
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: selectedUser._id,
          customMessage: messageText,
          locationPreferences: selectedPreferences,
          codeWord: codeWord
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send chat request');
      }

      toast({
        title: "Success",
        description: "Chat request sent!",
      });
      closeModal();
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
              <p className="text-gray-700 mb-4">{user.gender}</p>
              <Button
                onClick={() => openRequestModal(user)}
                className="w-full"
              >
                Send Chat Request
              </Button>
            </Card>
            
          ))}
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-11/12 max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Send Chat Request</h2>
            <p className="mb-2">
              Please enter a message (30-40 words), select your preferred meeting locations, and add a code word.
            </p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter your message (30-40 words)..."
              className="w-full p-2 border rounded mb-4"
              rows={4}
            />
            <div className="mb-4">
              <p className="mb-1">Select Meeting Locations:</p>
              <div className="flex flex-wrap gap-2">
                {preferenceOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={selectedPreferences.includes(option)}
                      onChange={() => handlePreferenceChange(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={codeWord}
              onChange={(e) => setCodeWord(e.target.value)}
              placeholder="Enter code word..."
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest}>
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
         <div className="flex gap-4 mt-6">
        <Button className="w-full" onClick={() => router.push("/chat")}>
          Accepted Requests
        </Button>
        <Button className="w-full" onClick={() => router.push("/explore/requests")}>
          Pending Requests
        </Button>
      </div>
    </div>
  );
}
