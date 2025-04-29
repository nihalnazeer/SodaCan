import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bell, ShoppingBag, User, Send, ArrowLeft, Coins } from 'lucide-react';
import api from '../services/api';
import './ViewRooms.css';

export default function GameRoom() {
  const [profile, setProfile] = useState({
    username: localStorage.getItem('username') || '.me',
    coins: parseInt(localStorage.getItem('coins')) || 1250,
  });
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { roomId } = useParams();

  // Fetch user profile, rooms, and members
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Please log in to access this page.');
          navigate('/login');
          return;
        }
        const userData = await api.getUserProfile();
        setProfile({
          username: userData.username || '.me',
          coins: userData.coins || 0,
        });
        localStorage.setItem('username', userData.username || '.me');
        localStorage.setItem('coins', userData.coins || 0);

        const roomData = await api.getAllRooms();
        if (!roomData || roomData.length === 0) {
          setError('No rooms found. Join a room to continue.');
          setRooms([]);
          return;
        }
        setRooms(roomData);
        const currentRoom = roomData.find((room) => room.id.toString() === roomId);
        if (currentRoom) {
          setSelectedRoom(currentRoom);
        } else {
          setError(`Room with ID ${roomId} not found.`);
        }

        // Fetch members
        try {
          const memberData = await api.getRoomMembers(currentRoom?.id);
          setMembers(memberData || []);
        } catch (err) {
          console.warn('Failed to fetch members, using mock data:', err);
          setMembers([
            { id: 1, username: 'User1' },
            { id: 2, username: 'User2' },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load profile or rooms. Please try again.');
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId, navigate]);

  // Fetch messages when selectedRoom changes
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      setLoading(true);
      setError('');
      try {
        const messageData = await api.getRoomMessages(selectedRoom.id);
        setMessages(messageData || []);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedRoom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    setError('');
    try {
      const message = await api.sendMessage({ room_id: selectedRoom.id, content: newMessage });
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGameAction = (action) => {
    alert(`${action} feature is not available in this version.`);
  };

  if (loading && !selectedRoom && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-transparent">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-400 mb-4"></div>
          <div className="animate-pulse text-red-400 text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !selectedRoom) {
    return (
      <div className="flex flex-col h-screen bg-dark-transparent">
        <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-800/50 bg-glass-dark z-20 h-16">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-semibold text-zinc-200">
              Game Room, <span className="text-red-400">{profile.username}</span>
            </h2>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/shop')}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-glass-dark border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 hover-panel"
            >
              <ShoppingBag className="w-5 h-5 text-zinc-300" />
            </button>
            <span className="flex items-center text-sm text-zinc-200">
              {profile.coins} <Coins className="w-4 h-4 text-yellow-400 ml-1" />
            </span>
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-glass-dark border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 hover-panel"
            >
              <Bell className="w-5 h-5 text-zinc-300" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center px-3 rounded-lg bg-glass-dark border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 hover-panel"
            >
              <User className="w-5 h-5 text-zinc-300 mr-2" />
              <span className="text-sm font-medium text-zinc-200">{profile.username}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error || 'Room not found.'}</p>
            <button
              onClick={() => navigate('/rooms')}
              className="py-3 px-6 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-dark-transparent relative overflow-hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-800/50 bg-glass-dark z-20 h-16">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-semibold text-zinc-200">
            Game Room, <span className="text-red-400">{profile.username}</span>
          </h2>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/shop')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-glass-dark border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 hover-panel"
          >
            <ShoppingBag className="w-5 h-5 text-zinc-300" />
          </button>
          <span className="flex items-center text-sm text-zinc-200">
            {profile.coins} <Coins className="w-4 h-4 text-yellow-400 ml-1" />
          </span>
          <button
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-glass-dark border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 hover-panel"
          >
            <Bell className="w-5 h-5 text-zinc-300" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center px-3 rounded-lg bg-glass-dark border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 hover-panel"
          >
            <User className="w-5 h-5 text-zinc-300 mr-2" />
            <span className="text-sm font-medium text-zinc-200">{profile.username}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navbar: Members List */}
        <div className="w-80 bg-glass-dark border-r border-zinc-800/60 p-6 flex flex-col">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate('/rooms')}
              className="flex items-center text-zinc-200 hover:text-red-400 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Rooms
            </button>
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Room Members</h3>
          <div className="flex-1 overflow-y-auto space-y-3 member-list">
            {members.length === 0 ? (
              <p className="text-zinc-400">No members in this room.</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-glass-dark rounded-lg border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 member-card"
                >
                  <span className="text-base font-medium text-zinc-200">{member.username}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Game Options */}
        <div className="flex-1 mx-6 flex flex-col py-6">
          <div className="flex-1 bg-glass-dark rounded-lg border border-zinc-700/30 p-6 flex flex-col">
            <h3 className="text-xl font-semibold text-zinc-200 mb-4">{selectedRoom.name} - Game Options</h3>
            <p className="text-zinc-400 text-sm mb-6 italic">
              All bets are moderated by a room moderator or a top bettor to ensure fairness.
            </p>
            <div className="grid grid-cols-1 gap-6 flex-1">
              <div className="game-option-card bg-glass-dark rounded-lg border border-zinc-700/30 p-6 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300">
                <h4 className="text-lg font-semibold text-zinc-200 mb-2">Create Bets</h4>
                <p className="text-zinc-400 text-sm mb-4">
                  Start a new bet! Set your stakes and challenge others in the room. A moderator will review your bet before it goes live.
                </p>
                <button
                  onClick={() => handleGameAction('Create Bets')}
                  className="py-3 px-6 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
                >
                  Create a Bet
                </button>
              </div>
              <div className="game-option-card bg-glass-dark rounded-lg border border-zinc-700/30 p-6 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300">
                <h4 className="text-lg font-semibold text-zinc-200 mb-2">View Bets</h4>
                <p className="text-zinc-400 text-sm mb-4">
                  Check out all the bets happening in this room. See who’s betting what and join the action!
                </p>
                <button
                  onClick={() => handleGameAction('View Bets')}
                  className="py-3 px-6 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
                >
                  View All Bets
                </button>
              </div>
              <div className="game-option-card bg-glass-dark rounded-lg border border-zinc-700/30 p-6 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300">
                <h4 className="text-lg font-semibold text-zinc-200 mb-2">Challenge Other Member 1v1</h4>
                <p className="text-zinc-400 text-sm mb-4">
                  Go head-to-head with another member. Pick your opponent and set the terms for a thrilling showdown!
                </p>
                <button
                  onClick={() => handleGameAction('Challenge Other Member 1v1')}
                  className="py-3 px-6 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
                >
                  Start a Challenge
                </button>
              </div>
            </div>
            <div className="coins-section bg-glass-dark rounded-lg border border-zinc-700/30 p-6 mt-6">
              <h4 className="text-lg font-semibold text-zinc-200 mb-2">Ready to Bet? Grab Some Coins! 💰</h4>
              <p className="text-zinc-400 text-sm">
                You need coins to bet! If you’re running low, visit the{' '}
                <span
                  onClick={() => navigate('/shop')}
                  className="text-red-400 cursor-pointer hover:underline"
                >
                  shop
                </span>{' '}
                to purchase more and keep the fun going!
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Room List and Chat */}
        <div className="w-96 bg-glass-dark border-l border-zinc-800/60 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Your Rooms</h3>
          <div className="mb-6 overflow-y-auto space-y-3 room-list" style={{ maxHeight: '20%' }}>
            {rooms.length === 0 ? (
              <p className="text-zinc-400">No rooms joined. Explore rooms to join!</p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => navigate(`/rooms/${room.id}/game`)}
                  className={`p-4 bg-glass-dark rounded-lg border ${selectedRoom.id === room.id ? 'border-red-500/30' : 'border-zinc-700/30'} hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 cursor-pointer hover-panel room-card`}
                >
                  <h4 className="text-base font-medium text-zinc-200">{room.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{room.description || 'No description'}</p>
                </div>
              ))
            )}
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Chat</h3>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 chat-container smooth-chat">
            {messages.length === 0 ? (
              <p className="text-zinc-400 text-center">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border border-zinc-700/20 ${message.username === profile.username ? 'bg-red-900/20 ml-auto' : 'bg-glass-dark'} max-w-md transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-200">{message.username}</span>
                    <span className="text-xs text-zinc-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-400">{message.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-3 bg-zinc-800/50 border border-zinc-700/30 rounded-lg text-zinc-200 focus:outline-none focus:border-red-500/30 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="ml-3 px-4 py-3 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}