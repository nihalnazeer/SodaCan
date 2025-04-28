import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Pusher from 'pusher-js';
import api from '../services/api';
import './DashboardPage.css';

function Dashboard() {
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeChannel, setActiveChannel] = useState('welcome');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [channels, setChannels] = useState({});
  const [username, setUsername] = useState(localStorage.getItem('username') || 'User');
  const [coins, setCoins] = useState(localStorage.getItem('coins') || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [publicRoomName, setPublicRoomName] = useState('');
  const [privateRoomName, setPrivateRoomName] = useState('');
  const [privateRoomToken, setPrivateRoomToken] = useState('');
  const [showCoinNotification, setShowCoinNotification] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [toast, setToast] = useState(null);
  const [isRoomMember, setIsRoomMember] = useState(false);
  const pusherRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const publicRoomInputRef = useRef(null);
  const privateRoomInputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const maintainInputFocus = useCallback(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, []);

  const handleMessageInputChange = useCallback((e) => {
    setMessageInput(e.target.value);
  }, []);

  const checkMembership = useCallback(async (roomId) => {
    try {
      await api.getRoomMessages(roomId);
      setIsRoomMember(true);
      setError('');
    } catch (err) {
      if (err.response?.status === 403) {
        setIsRoomMember(false);
        setError('You must join this room to view messages');
      } else {
        setError(err.message || 'Failed to check membership');
      }
    }
  }, []);

  const handleRoomClick = useCallback(
    async (roomName) => {
      setActiveRoom(roomName);
      setActiveChannel('welcome');
      setShowSidebar(true);
      setMessages([]);
      const room = rooms.find((r) => r.name === roomName);
      if (room?.id) {
        await checkMembership(room.id);
      }
      maintainInputFocus();
    },
    [rooms, checkMembership, maintainInputFocus]
  );

  const handleChannelClick = useCallback((channel) => {
    setActiveChannel(channel);
    maintainInputFocus();
  }, [maintainInputFocus]);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await api.logout();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
      localStorage.removeItem('coins');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to logout. Clearing session anyway.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
      localStorage.removeItem('coins');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const createPublicRoom = useCallback(async () => {
    if (!publicRoomName.trim()) {
      setError('Please enter a room name');
      return;
    }
    setLoading(true);
    try {
      const data = await api.createPublicRoom({ name: publicRoomName });
      const newRoom = { ...data, type: 'public' };
      setRooms((prev) => [...prev, newRoom]);
      setChannels((prev) => ({ ...prev, [newRoom.name]: ['welcome', 'chat'] }));
      setActiveRoom(newRoom.name);
      setActiveChannel('welcome');
      setIsRoomMember(true);
      setPublicRoomName('');
      setShowModal(false);
      showToast('Public room created successfully!');
      maintainInputFocus();
    } catch (err) {
      console.error('Create public room error:', err);
      setError(err.message || 'Failed to create public room');
    } finally {
      setLoading(false);
    }
  }, [publicRoomName, showToast, maintainInputFocus]);

  const createPrivateRoom = useCallback(async () => {
    if (!privateRoomName.trim()) {
      setError('Please enter a room name');
      return;
    }
    setLoading(true);
    try {
      const data = await api.createPrivateRoom({ name: privateRoomName });
      const newRoom = { ...data, type: 'private', token: data.token };
      setRooms((prev) => [...prev, newRoom]);
      setChannels((prev) => ({ ...prev, [newRoom.name]: ['welcome', 'chat'] }));
      setActiveRoom(newRoom.name);
      setActiveChannel('welcome');
      setIsRoomMember(true);
      setPrivateRoomName('');
      setShowModal(false);
      showToast(`Private room created! Token: ${newRoom.token}`);
      maintainInputFocus();
    } catch (err) {
      console.error('Create private room error:', err);
      setError(err.message || 'Failed to create private room');
    } finally {
      setLoading(false);
    }
  }, [privateRoomName, showToast, maintainInputFocus]);

  const joinPrivateRoom = useCallback(async () => {
    if (!privateRoomToken.trim()) {
      setError('Please enter a room token');
      return;
    }
    setLoading(true);
    try {
      const data = await api.joinPrivateRoom(privateRoomToken);
      const newRoom = { ...data, type: 'private', token: privateRoomToken };
      setRooms((prev) => [...prev, newRoom]);
      setChannels((prev) => ({ ...prev, [newRoom.name]: ['welcome', 'chat'] }));
      setActiveRoom(newRoom.name);
      setActiveChannel('welcome');
      setIsRoomMember(true);
      setPrivateRoomToken('');
      setShowModal(false);
      showToast('Joined private room successfully!');
      maintainInputFocus();
    } catch (err) {
      console.error('Join private room error:', err);
      setError(err.message || 'No room found with that token');
    } finally {
      setLoading(false);
    }
  }, [privateRoomToken, showToast, maintainInputFocus]);

  const joinRoom = useCallback(async () => {
    if (!activeRoom) return;
    const room = rooms.find((r) => r.name === activeRoom);
    if (!room || !room.id) {
      setError('No valid room selected');
      return;
    }
    setLoading(true);
    try {
      if (room.type === 'public') {
        await api.joinPublicRoom(room.id);
      } else {
        await api.joinPrivateRoom(room.token);
      }
      setIsRoomMember(true);
      showToast('Joined room successfully!');
      maintainInputFocus();
      const messages = await api.getRoomMessages(room.id);
      setMessages(messages || []);
      scrollToBottom();
    } catch (err) {
      console.error('Join room error:', err);
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  }, [activeRoom, rooms, showToast, maintainInputFocus, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeRoom) return;
    const room = rooms.find((r) => r.name === activeRoom);
    if (!room || !room.id) {
      setError('No valid room selected');
      return;
    }
    try {
      const messageData = {
        room_id: room.id,
        content: messageInput,
      };
      await api.sendMessage(messageData);
      setMessageInput('');
      maintainInputFocus();
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.message || 'Failed to send message');
    }
  }, [activeRoom, messageInput, rooms, maintainInputFocus]);

  const copyToken = useCallback(async (token) => {
    try {
      await navigator.clipboard.write(token);
      showToast('Token copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy token:', err);
      showToast('Failed to copy token', 'error');
    }
  }, [showToast]);

  const createNewChannel = useCallback(() => {
    if (!activeRoom) return;
    const channelName = prompt('Enter the name of the new channel:');
    if (channelName) {
      setChannels((prev) => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), channelName.toLowerCase()],
      }));
      maintainInputFocus();
    }
  }, [activeRoom, maintainInputFocus]);

  useEffect(() => {
    const fetchUserAndRooms = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/');
          return;
        }
        const userData = await api.getUserProfile();
        setUsername(userData.username || 'User');
        setCoins(userData.coins || 0);
        localStorage.setItem('username', userData.username || 'User');
        localStorage.setItem('coins', userData.coins || 0);
        setShowCoinNotification(true);

        const fetchedRooms = await api.getAllRooms();
        if (!fetchedRooms || fetchedRooms.length === 0) {
          setError('No rooms available. Create or join a room to start.');
          setRooms([]);
          setChannels({});
          setActiveRoom(null);
          setActiveChannel('welcome');
        } else {
          const roomsWithType = fetchedRooms.map((room) => ({
            ...room,
            type: room.is_public ? 'public' : 'private',
          }));
          setRooms(roomsWithType);
          const newChannels = roomsWithType.reduce((acc, room) => {
            acc[room.name] = ['welcome', 'chat'];
            return acc;
          }, {});
          setChannels(newChannels);
          setActiveRoom(roomsWithType[0].name);
          setActiveChannel('welcome');
          await checkMembership(roomsWithType[0].id);
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load data');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndRooms();
  }, [navigate, checkMembership]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeRoom || activeChannel !== 'chat') return;
      try {
        const room = rooms.find((r) => r.name === activeRoom);
        if (!room || !room.id) {
          console.warn('No valid room ID for activeRoom:', activeRoom);
          setError('No valid room selected');
          return;
        }
        const fetchedMessages = await api.getRoomMessages(room.id);
        setMessages(fetchedMessages || []);
        setIsRoomMember(true);
        scrollToBottom();
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        if (err.response?.status === 403) {
          setIsRoomMember(false);
          setError('You must join this room to view messages');
        } else {
          setError(err.message || 'Failed to fetch messages');
        }
        setMessages([]);
      }
    };
    if (activeChannel === 'chat' && isRoomMember) {
      fetchMessages();
    } else if (activeChannel === 'welcome') {
      setMessages([]);
    } else {
      setMessages([]);
    }
  }, [activeRoom, activeChannel, rooms, isRoomMember, scrollToBottom]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !activeRoom || !isRoomMember) return;

    const room = rooms.find((r) => r.name === activeRoom);
    if (!room || !room.id) return;

    Pusher.logToConsole = process.env.NODE_ENV === 'development';

    pusherRef.current = new Pusher(process.env.REACT_APP_PUSHER_KEY || 'ce28e8f8898bf7fe20bb', {
      cluster: process.env.REACT_APP_PUSHER_CLUSTER || 'ap2',
      authEndpoint: 'http://localhost:8000/api/pusher/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const channel = pusherRef.current.subscribe(`room-${room.id}`);
    channel.bind('new-message', (data) => {
      console.log('Pusher new-message received:', data);
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id || `temp-${Date.now()}`,
            room_id: data.room_id,
            user_id: data.user_id,
            content: data.content || data.test_message,
            created_at: data.created_at || new Date().toISOString(),
            username: data.username || 'Unknown',
          },
        ];
      });
      scrollToBottom();
    });
    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`Subscribed to room-${room.id}`);
    });
    channel.bind('pusher:subscription_error', (err) => {
      console.error('Pusher subscription error:', err);
      setError('Failed to subscribe to real-time messages');
    });

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`room-${room.id}`);
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [activeRoom, rooms, isRoomMember, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const Spinner = () => (
    <div className="flex items-center justify-center p-4">
      <svg className="w-5 h-5 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
    </div>
  );

  const MessageInput = useMemo(() => (
    <div className="relative bg-zinc-800 rounded-md border border-zinc-700">
      <input
        type="text"
        placeholder={`Message ${activeChannel ? `#${activeChannel}` : 'channel'}`}
        value={messageInput}
        onChange={handleMessageInputChange}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        disabled={!activeRoom || !isRoomMember}
        className="w-full bg-transparent rounded-md px-4 py-3 text-zinc-200 border-none focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
        ref={messageInputRef}
      />
      <div className="absolute right-2 top-2 flex items-center space-x-1">
        <button
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-200 rounded-md transition-colors"
          disabled={!activeRoom || !isRoomMember}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-200 rounded-md transition-colors"
          disabled={!activeRoom || !isRoomMember}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </button>
        <button
          onClick={sendMessage}
          className="ml-1 px-3 py-1 bg-gradient-to-r from-zinc-700 to-zinc-600 rounded-md text-zinc-200 hover:shadow-md transition-all duration-300 disabled:opacity-50"
          disabled={!activeRoom || !isRoomMember || !messageInput.trim()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <path d="M22 2L11 13"></path>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
          </svg>
        </button>
      </div>
    </div>
  ), [activeRoom, activeChannel, isRoomMember, messageInput, handleMessageInputChange, sendMessage]);

  const RoomModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-800 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-zinc-200">Room Actions</h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Create Public Room</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter room name"
                value={publicRoomName}
                onChange={(e) => setPublicRoomName(e.target.value)}
                ref={publicRoomInputRef}
                className="flex-1 bg-zinc-800 rounded-md px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <button
                onClick={createPublicRoom}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-zinc-200"
              >
                Create
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Create Private Room</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter room name"
                value={privateRoomName}
                onChange={(e) => setPrivateRoomName(e.target.value)}
                ref={privateRoomInputRef}
                className="flex-1 bg-zinc-800 rounded-md px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <button
                onClick={createPrivateRoom}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-zinc-200"
              >
                Create
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Join Private Room</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter room token"
                value={privateRoomToken}
                onChange={(e) => setPrivateRoomToken(e.target.value)}
                className="flex-1 bg-zinc-800 rounded-md px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <button
                onClick={joinPrivateRoom}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-zinc-200"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const defaultOptions = [
    { name: 'Shop', action: () => alert('Visit the Shop!') },
    { name: 'Community Events', action: () => alert('Check out community events!') },
  ];

  const roomOptions = rooms.reduce((acc, room) => {
    acc[room.name] = [
      { name: 'Create a New Bet', action: () => alert(`Create a new bet for ${room.name}!`) },
      { name: 'Shop', action: () => alert(`Visit the ${room.name} Shop!`) },
      { name: 'Room Settings', action: () => alert(`${room.name} room settings!`) },
    ];
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200 font-sans">
      {toast && (
        <div
          className={`fixed bottom-4 right-4 p-3 rounded-md shadow-lg border ${
            toast.type === 'success'
              ? 'bg-green-800 border-green-700 text-green-200'
              : 'bg-red-800 border-red-700 text-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {coins > 0 && showCoinNotification && (
        <div className="fixed bottom-4 right-4 bg-zinc-800 border border-zinc-700 shadow-lg rounded-md p-3 max-w-xs">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-amber-900/30 border border-amber-800/50 flex items-center justify-center mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="9" stroke="#FFC107" strokeWidth="2" />
                <circle cx="12" cy="12" r="5" fill="#FFC107" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-200">You have {coins} coins</div>
              <div className="text-xs text-zinc-400">Use them in the shop or for bets</div>
            </div>
            <button
              onClick={() => setShowCoinNotification(false)}
              className="ml-2 text-zinc-400 hover:text-zinc-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="h-16 bg-zinc-900 flex items-center justify-between px-6 py-2 border-b border-zinc-800 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-md bg-gradient-to-br from-zinc-800 to-zinc-600 border border-zinc-700 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8"
            >
              <path
                d="M7 4H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V4Z"
                stroke="#a1a1aa"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 2V4" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 8H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 12H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 16H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-500">
              SodaClub
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-zinc-800 rounded-full px-3 py-1 border border-zinc-700">
            <div className="w-5 h-5 mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="9" stroke="#FFC107" strokeWidth="2" />
                <circle cx="12" cy="12" r="5" fill="#FFC107" />
              </svg>
            </div>
            <span className="font-medium text-amber-200">{coins}</span>
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l-.06-.06a2 2 0 0 1 2.83 0 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
            title="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-16 bg-zinc-900 flex flex-col items-center py-3 space-y-4 border-r border-zinc-800">
          <button
            className="relative w-10 h-10 rounded-lg flex items-center justify-center text-zinc-200 text-lg font-semibold bg-gradient-to-br from-zinc-800 to-zinc-600 border border-zinc-700 shadow-sm hover:shadow-md transition-all duration-300"
            title="Home"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="absolute hidden group-hover:block bg-zinc-800 text-zinc-200 text-xs rounded p-1 -top-10 left-0 whitespace-nowrap z-10">
              Home
            </span>
          </button>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room.name)}
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-zinc-200 text-lg font-semibold transition-all duration-300 ${
                activeRoom === room.name
                  ? 'bg-gradient-to-br from-zinc-800 to-zinc-600 border border-zinc-600 shadow-md scale-105'
                  : 'bg-zinc-950 border border-zinc-800 hover:bg-zinc-700 hover:shadow-zinc-700/30'
              }`}
              title={room.name}
            >
              {room.name.charAt(0).toUpperCase()}
              {room.type === 'private' && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-zinc-200 rounded-full"></span>
              )}
              <span className="absolute hidden group-hover:block bg-zinc-800 text-zinc-200 text-xs rounded p-1 -top-10 left-0 whitespace-nowrap z-10">
                {room.name} ({room.type})
              </span>
            </button>
          ))}
          <div className="flex-1"></div>
          <button
            onClick={() => setShowModal(true)}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center text-zinc-200 text-lg font-semibold bg-zinc-950 border border-zinc-800 hover:bg-zinc-700 hover:shadow-zinc-700/30 transition-all duration-300"
            title="Room Actions"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="absolute hidden group-hover:block bg-zinc-800 text-zinc-200 text-xs rounded p-1 -top-10 left-0 whitespace-nowrap z-10">
              Room Actions
            </span>
          </button>
        </div>

        {showSidebar && (
          <div className="w-64 bg-zinc-900 flex flex-col border-r border-zinc-800">
            <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between">
              <span className="font-semibold truncate">{activeRoom || 'Select a Room'}</span>
              <button
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                onClick={() => setShowSidebar(false)}
                title="Hide Sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <Spinner />
              ) : activeRoom ? (
                <>
                  <div className="text-zinc-400 text-xs font-semibold px-2 mb-2 flex justify-between items-center">
                    <span>{activeRoom.toUpperCase()} CHANNELS</span>
                    <button
                      onClick={createNewChannel}
                      className="text-zinc-400 hover:text-zinc-200 text-sm transition-all duration-300"
                      title="Create Channel"
                    >
                      +
                    </button>
                  </div>
                  {(channels[activeRoom] || []).map((channel) => (
                    <div
                      key={channel}
                      className={`flex items-center px-2 py-1 rounded-md cursor-pointer transition-all duration-300 ${
                        activeChannel === channel
                          ? 'bg-zinc-800 text-zinc-200 border-l-2 border-zinc-600'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                      onClick={() => handleChannelClick(channel)}
                    >
                      <span className="text-lg mr-2">#</span>
                      <span className="truncate">{channel}</span>
                    </div>
                  ))}
                  <div className="mt-4">
                    <div className="text-zinc-400 text-xs font-semibold px-2 mb-2">ROOM OPTIONS</div>
                    {(roomOptions[activeRoom] || defaultOptions).map((option) => (
                      <div
                        key={option.name}
                        onClick={option.action}
                        className="flex items-center px-2 py-1 rounded-md cursor-pointer hover:bg-zinc-800 hover:text-zinc-200 transition-all duration-300"
                      >
                        <span className="text-lg mr-2">•</span>
                        <span className="truncate">{option.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-zinc-400 text-xs font-semibold px-2 mb-2">OPTIONS</div>
                  {defaultOptions.map((option) => (
                    <div
                      key={option.name}
                      onClick={option.action}
                      className="flex items-center px-2 py-1 rounded-md cursor-pointer hover:bg-zinc-800 hover:text-zinc-200 transition-all duration-300"
                    >
                      <span className="text-lg mr-2">•</span>
                      <span className="truncate">{option.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="p-4 bg-zinc-900 flex items-center border-t border-zinc-800">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-zinc-800 to-zinc-600 flex items-center justify-center text-zinc-200 font-semibold mr-3">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium group relative">
                  {username}
                  <span className="absolute hidden group-hover:block bg-zinc-800 text-zinc-200 text-xs rounded p-1 -top-8 left-0 whitespace-nowrap z-10">
                    {username}
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  <span className="text-zinc-400">Online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-zinc-900">
          {activeChannel && (
            <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center">
                {!showSidebar && (
                  <button
                    className="w-6 h-6 mr-2 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    onClick={() => setShowSidebar(true)}
                    title="Show Sidebar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <span className="mr-2 font-semibold">#</span>
                <span className="font-semibold">{activeChannel}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </button>
                <button className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5"
                  >
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l-.06-.06a2 2 0 0 1 2.83 0 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">
            {error && (
              <div className="mb-4 p-3 text-sm text-red-300 bg-zinc-800 rounded-md border border-red-900/50">
                {error}
              </div>
            )}
            {loading ? (
              <Spinner />
            ) : (
              <div className="flex flex-col space-y-4">
                {activeRoom && rooms.find((r) => r.name === activeRoom)?.type === 'private' && (
                  <div className="p-3 bg-zinc-800 rounded-md border border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-zinc-200">Room Token: </span>
                        <span className="text-sm text-zinc-400">
                          {rooms.find((r) => r.name === activeRoom)?.token || 'N/A'}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToken(rooms.find((r) => r.name === activeRoom)?.token || '')}
                        className="text-zinc-400 hover:text-zinc-200"
                        title="Copy Token"
                        disabled={!rooms.find((r) => r.name === activeRoom)?.token}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-5 h-5"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Share this token with others to invite them to this private room.
                    </p>
                  </div>
                )}
                {activeRoom ? (
                  <>
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-zinc-800 to-zinc-600 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold">#</span>
                      </div>
                      <h2 className="text-2xl font-bold text-zinc-200">
                        Welcome to #{activeChannel}
                      </h2>
                      <p className="text-zinc-400 mt-2">
                        This is the beginning of the {activeChannel} channel in {activeRoom}.
                      </p>
                      {activeChannel === 'welcome' && !isRoomMember && (
                        <button
                          onClick={joinRoom}
                          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-zinc-200"
                        >
                          Join Room
                        </button>
                      )}
                    </div>
                    {messages.length > 0 && (
                      <div className="border-t border-zinc-800 pt-4 mt-4">
                        {messages.map((msg) => (
                          <div key={msg.id} className="flex items-start mb-6">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-zinc-800 to-zinc-600 flex items-center justify-center text-zinc-200 font-semibold mr-3 flex-shrink-0">
                              {msg.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-semibold text-zinc-200 mr-2">
                                  {msg.username || 'Unknown'}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {new Date(msg.created_at).toLocaleString()}
                                </span>
                              </div>
                              <div className="mt-1 text-zinc-300">{msg.content}</div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-zinc-800 to-zinc-600 rounded-full flex items-center justify-center">
                      <span className="text-3xl font-bold">#</span>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-200">Welcome to SodaClub</h2>
                    <p className="text-zinc-400 mt-2">Join a room to start chatting!</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {activeChannel !== 'welcome' && (
            <div className="p-4 border-t border-zinc-800">{MessageInput}</div>
          )}
        </div>

        <div className="w-60 bg-zinc-900 border-l border-zinc-800 hidden md:block">
          <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">MEMBERS — 2</span>
            <button className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
          <div className="p-2">
            <div className="text-xs font-semibold text-zinc-400 px-2 py-1 mt-2">ONLINE — 2</div>
            <div className="p-2 rounded-md hover:bg-zinc-800 flex items-center cursor-pointer transition-all duration-300">
              <div className="relative mr-3">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-zinc-700 to-zinc-500 flex items-center justify-center text-zinc-200 font-semibold">
                  S
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900"></div>
              </div>
              <div className="text-sm group relative">
                SodaBot
                <div className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded bg-zinc-800 text-zinc-300">
                  BOT
                </div>
                <span className="absolute hidden group-hover:block bg-zinc-800 text-zinc-200 text-xs rounded p-1 -top-8 left-0 whitespace-nowrap z-10">
                  SodaBot
                </span>
              </div>
            </div>
            <div className="p-2 rounded-md hover:bg-zinc-800 flex items-center cursor-pointer transition-all duration-300">
              <div className="relative mr-3">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-zinc-800 to-zinc-600 flex items-center justify-center text-zinc-200 font-semibold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900"></div>
              </div>
              <div className="text-sm group relative">
                {username}
                <span className="absolute hidden group-hover:block bg-zinc-800 text-zinc-200 text-xs rounded p-1 -top-8 left-0 whitespace-nowrap z-10">
                  {username}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <RoomModal />}
    </div>
  );
}

export default Dashboard;