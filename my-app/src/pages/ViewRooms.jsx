import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, User, UserPlus, Settings, Send, ArrowLeft, Gamepad2 } from 'lucide-react';
import api from '../services/api';
import './ViewRooms.css';

export default function ViewRooms() {
  const [profile, setProfile] = useState({
    username: localStorage.getItem('username') || '.me',
    coins: parseInt(localStorage.getItem('coins')) || 1250,
  });
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [leaveConfirmModal, setLeaveConfirmModal] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile and joined rooms
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No access token found');
        }
        // Fetch user profile using /users/me
        const userData = await api.getUserProfile();
        setProfile({
          username: userData.username || '.me',
          coins: userData.coins || 0,
        });
        localStorage.setItem('username', userData.username || '.me');
        localStorage.setItem('coins', userData.coins || 0);

        // Fetch joined rooms using getAllRooms
        const roomData = await api.getAllRooms();
        setRooms(roomData || []);
        if (roomData.length > 0) {
          setSelectedRoom(roomData[0]);
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
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Fetch messages and members when selectedRoom changes
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchRoomData = async () => {
      setLoading(true);
      setError('');
      try {
        // Check welcome modal dismissal
        const dismissed = localStorage.getItem(`welcomeDismissed_${selectedRoom.id}`);
        setShowWelcome(!dismissed);

        // Fetch messages
        const messageData = await api.getRoomMessages(selectedRoom.id);
        setMessages(messageData || []);

        // Fetch members (mock if API fails)
        try {
          const memberData = await api.getRoomMembers(selectedRoom.id);
          setMembers(memberData || []);
        } catch (err) {
          console.warn('Failed to fetch members, using mock data:', err);
          setMembers([
            { id: 1, username: 'User1' },
            { id: 2, username: 'User2' },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch room data:', err);
        setError('Failed to load room data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
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

  const handleSendFriendRequest = () => {
    alert('Friend request feature is not available in this version.');
  };

  const handleLeaveRoom = () => {
    alert('Leave room feature is not available in this version.');
    setLeaveConfirmModal(false);
  };

  const handleDismissWelcome = () => {
    localStorage.setItem(`welcomeDismissed_${selectedRoom.id}`, 'true');
    setShowWelcome(false);
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-transparent">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-400 mb-4"></div>
          <div className="animate-pulse text-red-400 text-xl">Loading...</div>
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
            My Rooms, <span className="text-red-400">{profile.username}</span>
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
            <span className="text-sm font-medium text-zinc-300">{profile.username}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navbar: Room List */}
        <div className="w-80 bg-glass-dark border-r border-zinc-800/60 p-6 flex flex-col">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-zinc-200 hover:text-red-400 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Your Rooms</h3>
          <div className="flex-1 overflow-y-auto space-y-3 room-list">
            {rooms.length === 0 ? (
              <p className="text-zinc-400">No rooms joined. Explore rooms to join!</p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-4 bg-glass-dark rounded-lg border ${selectedRoom?.id === room.id ? 'border-red-500/30' : 'border-zinc-700/30'} hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 cursor-pointer hover-panel room-card`}
                >
                  <h4 className="text-base font-medium text-zinc-200">{room.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{room.description || 'No description'}</p>
                </div>
              ))
            )}
          </div>
          {selectedRoom && (
            <button
              onClick={() => setSettingsModal(true)}
              className="mt-4 py-3 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
            >
              <Settings className="w-5 h-5 mr-2 inline" />
              Room Settings
            </button>
          )}
        </div>

        {/* Main Content: Chat or Welcome Modal */}
        <div className="flex-1 mx-6 flex flex-col">
          {selectedRoom ? (
            showWelcome ? (
              <div className="bg-glass-dark p-8 rounded-lg border border-zinc-700/30 max-w-2xl mx-auto flex-1 flex flex-col justify-center">
                <h3 className="text-2xl font-semibold text-zinc-200 mb-4">Welcome to {selectedRoom.name}!</h3>
                <p className="text-zinc-400 mb-6">{selectedRoom.description || 'No description available.'}</p>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-zinc-200">What you can do here:</h4>
                  <ul className="list-disc list-inside text-zinc-400 mt-2 space-y-2">
                    <li><strong>Chat</strong>: Connect with other members in real-time.</li>
                    <li><strong>Bet</strong>: Place bets on matches or events with coins.</li>
                    <li><strong>Challenge</strong>: Create or join challenges to compete with others.</li>
                  </ul>
                </div>
                <button
                  onClick={handleDismissWelcome}
                  className="w-full py-3 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
                >
                  Got it, start chatting!
                </button>
              </div>
            ) : (
              <div className="flex-1 bg-glass-dark rounded-lg border border-zinc-700/30 p-6 flex flex-col">
                <h3 className="text-xl font-semibold text-zinc-200 mb-4">{selectedRoom.name}</h3>
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <p className="text-zinc-400 text-center">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border border-zinc-700/20 ${message.username === profile.username ? 'bg-red-900/20 ml-auto' : 'bg-glass-dark'} max-w-md`}
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
                    className="flex-1 p-3 bg-zinc-800/50 border border-zinc-700/30 rounded-lg text-zinc-200 focus:outline-none focus:border-red-500/30"
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
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-zinc-400 text-lg">Select a room to start chatting!</p>
            </div>
          )}
        </div>

        {/* Right Navbar: Members */}
        <div className="w-80 bg-glass-dark border-l border-zinc-800/60 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Members</h3>
          <div className="flex-1 overflow-y-auto space-y-3 member-list">
            {members.length === 0 ? (
              <p className="text-zinc-400">No members in this room.</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-glass-dark rounded-lg border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 flex items-center justify-between"
                >
                  <span className="text-base font-medium text-zinc-200">{member.username}</span>
                  {member.username !== profile.username && (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={loading}
                      className="p-2 bg-glass-dark rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow disabled:opacity-50"
                    >
                      <UserPlus className="w-5 h-5 text-zinc-300" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          {selectedRoom && (
            <button
              onClick={() => navigate(`/rooms/${selectedRoom.id}/game`)}
              className="mt-4 py-3 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
            >
              <Gamepad2 className="w-5 h-5 mr-2 inline" />
              Get to the Game
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {settingsModal && selectedRoom && (
        <div className="fixed inset-0 bg-dark-transparent backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-glass-dark p-6 rounded-lg border border-zinc-700/30 max-w-md w-full">
            <h3 className="text-xl font-semibold text-zinc-200 mb-4">Room Settings</h3>
            <p className="text-zinc-400 mb-6">Room settings are not available in this version.</p>
            <div className="flex justify-between space-x-3">
              <button
                type="button"
                onClick={() => setLeaveConfirmModal(true)}
                className="px-4 py-2 text-red-400 rounded-lg border border-red-700/30 hover:bg-red-900/50 transition-all"
              >
                Leave Room
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setSettingsModal(false)}
                  className="px-4 py-2 text-zinc-200 rounded-lg border border-zinc-700/30 hover:bg-zinc-800/50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {leaveConfirmModal && selectedRoom && (
        <div className="fixed inset-0 bg-dark-transparent backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-glass-dark p-6 rounded-lg border border-zinc-700/30 max-w-md w-full">
            <h3 className="text-xl font-semibold text-zinc-200 mb-4">Leave Room</h3>
            <p className="text-zinc-400 mb-6">Are you sure you want to leave {selectedRoom.name}? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setLeaveConfirmModal(false)}
                className="px-4 py-2 text-zinc-200 rounded-lg border border-zinc-700/30 hover:bg-zinc-800/50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLeaveRoom}
                disabled={loading}
                className="px-4 py-2 text-red-400 rounded-lg border border-red-700/30 hover:bg-red-900/50 transition-all disabled:opacity-50"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}