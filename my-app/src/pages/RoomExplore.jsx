import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, User, ArrowLeft, Plus, Users, Lock } from 'lucide-react';
import api from '../services/api';
import './RoomExplore.css';

export default function RoomExplore() {
  const [profile, setProfile] = useState({
    username: localStorage.getItem('username') || '.me',
    coins: parseInt(localStorage.getItem('coins')) || 1250,
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create' or 'join'
  const [roomForm, setRoomForm] = useState({ name: '', description: '' });
  const [privateRoomToken, setPrivateRoomToken] = useState('');
  const navigate = useNavigate();

  // Fetch user profile and public rooms
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No access token found');
        }
        // Fetch user profile
        const userData = await api.getUserProfile();
        setProfile({
          username: userData.username || '.me',
          coins: userData.coins || 0,
        });
        localStorage.setItem('username', userData.username || '.me');
        localStorage.setItem('coins', userData.coins || 0);

        // Fetch public rooms
        const roomData = await api.getPublicRooms();
        setRooms(roomData || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data. Please try again.');
        setRooms([]); // Fallback to empty list
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleJoinRoom = async (roomId) => {
    setLoading(true);
    setError('');
    try {
      await api.joinPublicRoom(roomId); // Removed unused 'response'
      navigate(`/rooms/${roomId}`); // Redirect to room page
    } catch (err) {
      console.error('Join room error:', err);
      setError('Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.createPublicRoom(roomForm);
      setRooms([...rooms, response]); // Add new room to list
      setModalOpen(false);
      setRoomForm({ name: '', description: '' });
    } catch (err) {
      console.error('Create room error:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPrivateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.joinPrivateRoom(privateRoomToken);
      navigate(`/rooms/${response.room_id || 'private'}`); // Adjust based on response
    } catch (err) {
      console.error('Join private room error:', err);
      setError('Invalid token or failed to join. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setRoomForm({ name: '', description: '' });
    setPrivateRoomToken('');
    setError('');
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-transparent">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-400 mb-4"></div>
          <div className="animate-pulse text-red-400 text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-dark-transparent relative overflow-hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-800/50 bg-glass-dark z-20">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-semibold text-zinc-200">
            Explore Rooms, <span className="text-red-400">{profile.username}</span>
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
      <div className="flex-1 flex px-8 py-6 relative z-10">
        {/* Room List */}
        <div className="flex-1 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-zinc-200 hover:text-red-400 transition-colors duration-300"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <h2 className="text-2xl font-semibold text-zinc-200">Explore Public Rooms</h2>
            </div>
          </div>
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="p-6 bg-glass-dark rounded-lg border border-zinc-700/30 text-center">
                <p className="text-zinc-400">No public rooms available. Create one to get started!</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-6 bg-glass-dark rounded-lg border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 hover-panel"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-200">{room.name}</h3>
                      <p className="text-sm text-zinc-400 mt-1">{room.description || 'No description'}</p>
                      <div className="flex items-center mt-2 text-xs text-zinc-400">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{room.member_count || 0} members</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Create/Join Options */}
        <div className="w-80 bg-glass-dark border-l border-zinc-800/60 p-6 flex flex-col space-y-4">
          <button
            onClick={() => openModal('create')}
            className="flex items-center justify-center py-3 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Room
          </button>
          <button
            onClick={() => openModal('join')}
            className="flex items-center justify-center py-3 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow"
          >
            <Lock className="w-5 h-5 mr-2" />
            Join Private Room
          </button>
        </div>
      </div>

      {/* Modal for Create/Join */}
      {modalOpen && (
        <div className="fixed inset-0 bg-dark-transparent backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-glass-dark p-6 rounded-lg border border-zinc-700/30 max-w-md w-full">
            <h3 className="text-xl font-semibold text-zinc-200 mb-4">
              {modalType === 'create' ? 'Create New Room' : 'Join Private Room'}
            </h3>
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            {modalType === 'create' ? (
              <form onSubmit={handleCreateRoom}>
                <div className="mb-4">
                  <label className="block text-sm text-zinc-200 mb-1">Room Name</label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    className="w-full p-2 bg-zinc-800/50 border border-zinc-700/30 rounded-lg text-zinc-200 focus:outline-none focus:border-red-500/30"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-zinc-200 mb-1">Description (optional)</label>
                  <textarea
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    className="w-full p-2 bg-zinc-800/50 border border-zinc-700/30 rounded-lg text-zinc-200 focus:outline-none focus:border-red-500/30"
                    rows={3}
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-zinc-200 rounded-lg border border-zinc-700/30 hover:bg-zinc-800/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all button-glow disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleJoinPrivateRoom}>
                <div className="mb-4">
                  <label className="block text-sm text-zinc-200 mb-1">Room Token</label>
                  <input
                    type="text"
                    value={privateRoomToken}
                    onChange={(e) => setPrivateRoomToken(e.target.value)}
                    className="w-full p-2 bg-zinc-800/50 border border-zinc-700/30 rounded-lg text-zinc-200 focus:outline-none focus:border-red-500/30"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-zinc-200 rounded-lg border border-zinc-700/30 hover:bg-zinc-800/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all button-glow disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}