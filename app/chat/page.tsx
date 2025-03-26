"use client";
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, UserCircle, Lock } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  encryptMessage,
  decryptMessage
} from '@/lib/crypto';

interface ChatUser {
  _id: string;      
  username: string;
  publicKey: string;
}

interface Message {
  _id: string;         
  sender: string;     
  receiver: string;  
  content: string;     
  timestamp?: string;  
  encrypted?: boolean;
}
interface JwtPayload {
  id?: string;
  userId: string;
  _id?: string;
  username?: string;
}

export default function Chat() {
  const { toast } = useToast();
  const [activeChats, setActiveChats] = useState<ChatUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatKeys = useRef<Map<string, CryptoKey>>(new Map());
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const userId = decoded.userId;
        setMyUserId(userId || null);
      } catch (error) {
        console.error('Failed to decode token', error);
      }
    }
    const initCrypto = async () => {
      const newKeyPair = await generateKeyPair();
      setKeyPair(newKeyPair);
      const publicKeyStr = await exportPublicKey(newKeyPair.publicKey);

      await fetch('/api/user/publicKey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ publicKey: publicKeyStr }),
      });
    };
    initCrypto();
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      auth: { token: localStorage.getItem('token') }
    });
  
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });
  
    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast({
        variant: "destructive",
        title: "Socket Connection Error",
        description: error.message,
      });
    });
  
    setSocket(newSocket);
  
    return () => {
      newSocket.disconnect();
    };
  }, [toast]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = async (message: Message) => {
      if (
        myUserId &&
        selectedChat &&
        (
          (message.sender === selectedChat && message.receiver === myUserId) ||
          (message.sender === myUserId && message.receiver === selectedChat)
        )
      ) {
        // Debug logging
        console.log('Received Message:', {
          sender: message.sender,
          receiver: message.receiver,
          content: message.content,
          encrypted: message.encrypted
        });
    
        console.log('Current KeyPair:', {
          publicKey: keyPair?.publicKey ? 'Available' : 'Not Available',
          privateKey: keyPair?.privateKey ? 'Available' : 'Not Available'
        });
    
        // Treat undefined encrypted flag as "true"
        if (keyPair && (typeof message.encrypted === 'undefined' || message.encrypted)) {
          try {
            console.log('Attempting to decrypt:', {
              encryptedContent: message.content,
              privateKeyType: keyPair.privateKey.type
            });
    
            const decryptedContent = await decryptMessage(
              message.content,
              keyPair.privateKey
            );
            
            console.log('Decryption successful:', decryptedContent);
    
            setMessages(prev => [...prev, {
              ...message,
              content: decryptedContent,
              encrypted: true
            }]);
          } catch (error: any) {
            console.error('Full Decryption Error:', {
              message: error.message,
              stack: error.stack,
              encryptedMessage: message.content
            });
    
            setMessages(prev => [...prev, {
              ...message,
              content: '[Decryption Failed: ' + error.message + ']',
            }]);
          }
        } else {
          console.log('Decryption skipped:', {
            keyPairExists: !!keyPair,
            messageEncrypted: message.encrypted
          });
          setMessages(prev => [...prev, message]);
        }
      }
    };
    socket.on('message', handleMessage);

    return () => {
      socket.off('message', handleMessage);
    };
  }, [socket, selectedChat, keyPair, myUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chat', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch chats');
      const data = await response.json();

      setActiveChats(data.activeChats);
      setPendingRequests(data.pendingRequests);
      
      // Import and cache public keys for each active chat
      for (const chat of data.activeChats) {
        if (chat.publicKey && !chatKeys.current.has(chat._id)) {
          const publicKey = await importPublicKey(chat.publicKey);
          chatKeys.current.set(chat._id, publicKey);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        const response = await fetch(`/api/messages?sender=${myUserId}&receiver=${selectedChat}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        console.log(data);
        const decryptedMessages = await Promise.all(data.messages.map(async (message: Message) => {
          if ((typeof message.encrypted === 'undefined' || message.encrypted) && keyPair) {
            console.log("hi",message)
            try {
              const decryptedContent = await decryptMessage(
                message.content, 
                keyPair.privateKey
              );
              return {
                ...message,
                content: decryptedContent,
                encrypted: true
              };
            } catch (error) {
              console.error('Decryption failed for message:', error);
              return {
                ...message,
                content: '[Decryption Failed]'
              };
            }
          }
          return message;
        }));

        setMessages(decryptedMessages);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    };
    fetchMessages();
  }, [selectedChat, toast, keyPair, myUserId]);

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim() || !socket || !keyPair) return;
    try {
      const recipientPublicKey = chatKeys.current.get(selectedChat);
      if (!recipientPublicKey) {
        throw new Error('Recipient public key not found');
      }
      
      const encryptedContent = await encryptMessage(newMessage, recipientPublicKey);
      socket.emit('message', {
        receiver: selectedChat,
        content: encryptedContent,
        encrypted: true, 
      });

      setMessages(prev => [
        ...prev,
        {
          _id: Date.now().toString(),
          sender: myUserId || 'me',
          receiver: selectedChat,
          content: newMessage,
          timestamp: new Date().toISOString(),
          encrypted: true,
        },
      ]);

      setNewMessage('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message: " + error.message,
      });
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-indigo-500 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-4 lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Active Chats</h2>
          <div className="space-y-2">
            {activeChats.map((chat) => (
              <Button
                key={chat._id}
                variant={selectedChat === chat._id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedChat(chat._id)}
              >
                <UserCircle className="mr-2" />
                {chat.username}
                <Lock className="ml-auto h-4 w-4 text-green-500" />
              </Button>
            ))}
          </div>
        </Card>
        <Card className="p-4 lg:col-span-3">
          {selectedChat ? (
            <>
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
                <UserCircle className="h-6 w-6" />
                <span className="font-semibold">
                  {activeChats.find(c => c._id === selectedChat)?.username}
                </span>
                <Lock className="ml-2 h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-500">End-to-end encrypted</span>
              </div>
              <div className="h-[500px] overflow-y-auto mb-4 space-y-4">
                {messages.map((message) => {
                  const isMyMessage = message.sender === myUserId;
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          isMyMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'
                        }`}
                      >
                        <p>{message.content}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-xs opacity-70">
                            {message.timestamp
                              ? new Date(message.timestamp).toLocaleTimeString()
                              : ''}
                          </span>
                          <Lock className="h-3 w-3 opacity-70" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-gray-500">
              Select a chat to start messaging
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
