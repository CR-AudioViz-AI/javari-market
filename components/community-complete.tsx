'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageCircle,
  Send,
  Users,
  TrendingUp,
  Heart,
  MessageSquare,
  Clock
} from 'lucide-react';

function getSupabase() {
  var sb = require('@supabase/supabase-js')
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return sb.createClient(url, key, { auth: { persistSession: false } })
}


interface Message {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  message: string;
  ticker?: string;
  created_at: string;
  likes: number;
  replies_count: number;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  message_count: number;
  active_users: number;
}

const CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'general',
    name: 'General Discussion',
    description: 'Talk about markets, stocks, and investing strategies',
    message_count: 0,
    active_users: 0
  },
  {
    id: 'ai-picks',
    name: 'AI Picks Discussion',
    description: 'Discuss AI stock recommendations and performance',
    message_count: 0,
    active_users: 0
  },
  {
    id: 'paper-trading',
    name: 'Paper Trading',
    description: 'Share your paper trading results and strategies',
    message_count: 0,
    active_users: 0
  },
  {
    id: 'beginners',
    name: 'Beginners Corner',
    description: 'New to investing? Ask questions and learn',
    message_count: 0,
    active_users: 0
  }
];

export default function CommunityComplete() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Load messages for default room
      await loadMessages('general');
      
      // Set up real-time subscription
      const channel = supabase
        .channel('community_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'community_messages'
          },
          (payload) => {
            if (payload.new.room_id === selectedRoom) {
              setMessages(prev => [...prev, payload.new as Message]);
            }
          }
        )
        .subscribe();

      setLoading(false);

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error initializing chat:', error);
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('community_messages')
        .insert([
          {
            room_id: selectedRoom,
            user_id: currentUser.id,
            user_email: currentUser.email,
            user_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
            message: newMessage.trim(),
            likes: 0,
            replies_count: 0
          }
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const getUserInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };

  const getUserColor = (userId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500'
    ];
    const index = userId?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading community chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Community</h1>
        <p className="text-gray-600">
          Connect with other investors, share strategies, and discuss AI picks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Rooms Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Chat Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {CHAT_ROOMS.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRoom === room.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{room.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {messages.filter(m => m).length}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{room.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600 space-y-2">
                <p>• Be respectful and professional</p>
                <p>• No financial advice (discuss ideas only)</p>
                <p>• No spam or promotion</p>
                <p>• Help beginners learn</p>
                <p>• Share knowledge, not predictions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {CHAT_ROOMS.find(r => r.id === selectedRoom)?.name}
                  </CardTitle>
                  <CardDescription>
                    {CHAT_ROOMS.find(r => r.id === selectedRoom)?.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {messages.filter(m => m).length} messages
                </Badge>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Be the first to start the conversation!</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isCurrentUser = message.user_id === currentUser?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className={`${getUserColor(message.user_id)} flex-shrink-0`}>
                          <AvatarFallback className="text-white">
                            {getUserInitials(message.user_name || message.user_email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-grow ${isCurrentUser ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">
                              {message.user_name || message.user_email?.split('@')[0]}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <div
                            className={`inline-block p-3 rounded-lg max-w-md ${
                              isCurrentUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          </div>
                          {message.ticker && (
                            <Badge className="mt-1 text-xs" variant="outline">
                              ${message.ticker}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            {/* Input Area */}
            <div className="border-t p-4">
              {currentUser ? (
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-grow"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Sign in to join the conversation
                  </p>
                  <Button>Sign In</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Trending Discussions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trending Discussions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge>AI Picks</Badge>
                <span className="text-xs text-gray-600">24 messages</span>
              </div>
              <p className="text-sm font-semibold mb-1">Is NVDA still a buy?</p>
              <p className="text-xs text-gray-600">Discussion about AI's NVDA recommendation</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge>Strategy</Badge>
                <span className="text-xs text-gray-600">18 messages</span>
              </div>
              <p className="text-sm font-semibold mb-1">Paper trading tips</p>
              <p className="text-xs text-gray-600">Sharing successful strategies</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge>Learning</Badge>
                <span className="text-xs text-gray-600">12 messages</span>
              </div>
              <p className="text-sm font-semibold mb-1">Understanding P/E ratios</p>
              <p className="text-xs text-gray-600">Beginners asking about fundamentals</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
