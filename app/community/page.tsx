'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  MessageCircle, Users, Send, Hash, TrendingUp, 
  Trophy, Gamepad2, HelpCircle, RefreshCw, Smile,
  ThumbsUp, Clock, User, ChevronRight
} from 'lucide-react';
import { JavariHelpButton } from '@/components/JavariWidget';

// Local storage key
const COMMUNITY_STORAGE_KEY = 'market-oracle-community';

// Chat rooms configuration
const CHAT_ROOMS = [
  { id: 'general', name: 'General', icon: MessageCircle, description: 'General discussion about Market Oracle', color: 'cyan' },
  { id: 'ai-picks', name: 'AI Picks', icon: TrendingUp, description: 'Discuss AI stock recommendations', color: 'emerald' },
  { id: 'ai-battle', name: 'AI Battle', icon: Trophy, description: 'Talk about AI performance rankings', color: 'yellow' },
  { id: 'paper-trading', name: 'Paper Trading', icon: Gamepad2, description: 'Share your paper trading results', color: 'purple' },
  { id: 'help', name: 'Help & Tips', icon: HelpCircle, description: 'Get help and share tips', color: 'blue' },
];

// Demo messages for initial load
const DEMO_MESSAGES: Record<string, Message[]> = {
  'general': [
    { id: '1', username: 'AIEnthusiast', message: 'Welcome to Market Oracle! This is an amazing platform.', timestamp: Date.now() - 3600000, likes: 5 },
    { id: '2', username: 'TraderJoe', message: 'Has anyone seen the latest AI battle results? TechVanguard is crushing it!', timestamp: Date.now() - 1800000, likes: 3 },
    { id: '3', username: 'NewbieInvestor', message: 'Just started using the paper trading feature. Really helpful for learning!', timestamp: Date.now() - 900000, likes: 2 },
  ],
  'ai-picks': [
    { id: '1', username: 'StockGuru', message: 'NVDA pick from TechVanguard AI is up 29%! 🚀', timestamp: Date.now() - 2700000, likes: 8 },
    { id: '2', username: 'CryptoKing', message: 'CryptoQuantum called the BTC rally perfectly', timestamp: Date.now() - 1500000, likes: 4 },
  ],
  'ai-battle': [
    { id: '1', username: 'DataNerd', message: 'ValueHunter Pro has the best win rate this week', timestamp: Date.now() - 2400000, likes: 6 },
    { id: '2', username: 'AIWatcher', message: 'I think GlobalMacro AI is underrated for long-term picks', timestamp: Date.now() - 1200000, likes: 3 },
  ],
  'paper-trading': [
    { id: '1', username: 'PaperChamp', message: 'Started with $10k, now at $12,500 following AI picks!', timestamp: Date.now() - 2100000, likes: 7 },
    { id: '2', username: 'SimTrader', message: 'Pro tip: Use the portfolio tracker to monitor your positions', timestamp: Date.now() - 900000, likes: 4 },
  ],
  'help': [
    { id: '1', username: 'Helper', message: 'Click the Javari AI button for instant help on any page!', timestamp: Date.now() - 3000000, likes: 5 },
    { id: '2', username: 'TipMaster', message: 'Use the watchlist to track picks without adding to portfolio', timestamp: Date.now() - 1800000, likes: 3 },
  ],
};

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  likes: number;
}

interface StoredData {
  messages: Record<string, Message[]>;
  username: string;
  likedMessages: string[];
}

// Get stored data
function getStoredData(): StoredData {
  if (typeof window === 'undefined') {
    return { messages: DEMO_MESSAGES, username: '', likedMessages: [] };
  }
  try {
    const stored = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Merge with demo messages if rooms are empty
      Object.keys(DEMO_MESSAGES).forEach(room => {
        if (!data.messages[room] || data.messages[room].length === 0) {
          data.messages[room] = DEMO_MESSAGES[room];
        }
      });
      return data;
    }
  } catch {}
  return { messages: DEMO_MESSAGES, username: '', likedMessages: [] };
}

// Save stored data
function saveStoredData(data: StoredData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(data));
}

// Message component
function MessageBubble({ 
  msg, 
  isOwn, 
  onLike, 
  hasLiked 
}: { 
  msg: Message; 
  isOwn: boolean;
  onLike: () => void;
  hasLiked: boolean;
}) {
  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-cyan-600 text-white rounded-br-md' 
            : 'bg-gray-800 text-white rounded-bl-md'
        }`}>
          {!isOwn && (
            <div className="text-xs font-medium text-cyan-400 mb-1">{msg.username}</div>
          )}
          <p className="text-sm">{msg.message}</p>
        </div>
        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
          <span>{timeAgo(msg.timestamp)}</span>
          <button
            onClick={onLike}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-800 transition-colors ${
              hasLiked ? 'text-cyan-400' : ''
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            {msg.likes > 0 && <span>{msg.likes}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load data on mount
  useEffect(() => {
    const data = getStoredData();
    setMessages(data.messages);
    setUsername(data.username);
    setLikedMessages(new Set(data.likedMessages));
    
    if (!data.username) {
      setShowUsernameModal(true);
    }
  }, []);
  
  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);
  
  // Save username
  const saveUsername = (name: string) => {
    const trimmed = name.trim() || `Guest${Math.floor(Math.random() * 10000)}`;
    setUsername(trimmed);
    const data = getStoredData();
    data.username = trimmed;
    saveStoredData(data);
    setShowUsernameModal(false);
  };
  
  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !username) return;
    
    const msg: Message = {
      id: Date.now().toString(),
      username,
      message: newMessage.trim(),
      timestamp: Date.now(),
      likes: 0,
    };
    
    const updatedMessages = {
      ...messages,
      [selectedRoom]: [...(messages[selectedRoom] || []), msg],
    };
    
    setMessages(updatedMessages);
    setNewMessage('');
    
    const data = getStoredData();
    data.messages = updatedMessages;
    saveStoredData(data);
  };
  
  // Like message
  const toggleLike = (msgId: string) => {
    const roomMessages = messages[selectedRoom] || [];
    const hasLiked = likedMessages.has(msgId);
    
    const updatedMessages = {
      ...messages,
      [selectedRoom]: roomMessages.map(m => 
        m.id === msgId 
          ? { ...m, likes: hasLiked ? Math.max(0, m.likes - 1) : m.likes + 1 }
          : m
      ),
    };
    
    const updatedLikes = new Set(likedMessages);
    if (hasLiked) {
      updatedLikes.delete(msgId);
    } else {
      updatedLikes.add(msgId);
    }
    
    setMessages(updatedMessages);
    setLikedMessages(updatedLikes);
    
    const data = getStoredData();
    data.messages = updatedMessages;
    data.likedMessages = Array.from(updatedLikes);
    saveStoredData(data);
  };
  
  const currentRoom = CHAT_ROOMS.find(r => r.id === selectedRoom)!;
  const roomMessages = messages[selectedRoom] || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Users className="w-10 h-10 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Community
            </span>
            <JavariHelpButton topic="community chat rooms" />
          </h1>
          <p className="text-gray-400">
            Connect with other traders and discuss AI picks. Messages are saved locally.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Room List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  Chat Rooms
                </h3>
              </div>
              <div className="p-2">
                {CHAT_ROOMS.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                      selectedRoom === room.id
                        ? `bg-${room.color}-900/30 border border-${room.color}-700/50`
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    <room.icon className={`w-5 h-5 text-${room.color}-400`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{room.name}</div>
                      <div className="text-xs text-gray-500 truncate">{room.description}</div>
                    </div>
                    {selectedRoom === room.id && (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* User Info */}
            <div className="mt-4 bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{username || 'Guest'}</div>
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Change name
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 flex flex-col h-[600px]">
              {/* Room Header */}
              <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                <currentRoom.icon className={`w-6 h-6 text-${currentRoom.color}-400`} />
                <div>
                  <h2 className="font-semibold">{currentRoom.name}</h2>
                  <p className="text-xs text-gray-500">{currentRoom.description}</p>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {roomMessages.length > 0 ? (
                  roomMessages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.username === username}
                      onLike={() => toggleLike(msg.id)}
                      hasLiked={likedMessages.has(msg.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={`Message #${currentRoom.name.toLowerCase()}...`}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Messages are stored locally on your device
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
          <p className="text-xs text-gray-500">
            This is a local-only community feature. Messages are not shared with other users.
            For a real community experience, visit the{' '}
            <a href="https://craudiovizai.com/community" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
              CR AudioViz AI Community
            </a>.
          </p>
        </div>
      </main>
      
      {/* Username Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Set Your Username
            </h3>
            <input
              type="text"
              defaultValue={username}
              placeholder="Enter your username..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-4 focus:outline-none focus:border-cyan-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveUsername((e.target as HTMLInputElement).value);
                }
              }}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => saveUsername('')}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                Use Random
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter your username..."]') as HTMLInputElement;
                  saveUsername(input?.value || '');
                }}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
