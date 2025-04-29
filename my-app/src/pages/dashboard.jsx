import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, User, Users, Clock, LogOut, Zap } from 'lucide-react';
import api from '../services/api';
import './DashboardPage.css';

export default function Dashboard() {
  // State management
  const [profile, setProfile] = useState({
    username: localStorage.getItem('username') || '.me',
    coins: parseInt(localStorage.getItem('coins')) || 1250,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotBets] = useState([
    { id: 1, title: 'Team A vs Team B', odds: '2.5', category: 'Football', time: '15:30' },
    { id: 2, title: 'Player X Wins Match', odds: '1.8', category: 'Tennis', time: '12:45' },
    { id: 3, title: 'Team C Scores First', odds: '3.2', category: 'Basketball', time: '19:20' },
    { id: 4, title: 'Match Total Over 2.5', odds: '1.95', category: 'Football', time: '20:00' },
  ]);
  const [recentActivities] = useState([
    {
      id: 1,
      icon: <Zap size={16} />,
      title: 'You won a bet on Team A!',
      description: '+250 points awarded to your account',
      time: '2m ago',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
    },
    {
      id: 2,
      icon: <Users size={16} />,
      title: 'betmaster joined Room #4',
      description: 'Your friend is now active in "Champions League"',
      time: '13m ago',
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-400',
    },
    {
      id: 3,
      icon: <Zap size={16} />,
      title: 'New room created: Epic Showdown',
      description: 'Join now to compete for 500 coins!',
      time: '25m ago',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
    },
    {
      id: 4,
      icon: <Users size={16} />,
      title: 'luckygamer invited you to Room #7',
      description: 'Join their private room for a quick match',
      time: '1h ago',
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-400',
    },
  ]);

  const navigate = useNavigate();

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No access token found');
        }
        const userData = await api.getUserProfile();
        setProfile({
          username: userData.username || '.me',
          coins: userData.coins || 0,
        });
        localStorage.setItem('username', userData.username || '.me');
        localStorage.setItem('coins', userData.coins || 0);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setError('Failed to load profile. Using cached data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    setError('');
    try {
      await api.logout();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
      localStorage.removeItem('coins');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Clearing session anyway.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
      localStorage.removeItem('coins');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
    <div className="flex min-h-screen bg-dark-transparent relative overflow-hidden">
      {/* Left Sidebar: Hot Bets */}
      <div className="w-80 bg-glass-dark border-r border-zinc-800/60 flex flex-col p-6 z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mr-3 group-hover:border-red-500/30 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-zinc-300">
                <path
                  d="M7 4H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V4Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 2V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10 16H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-zinc-200">SodaClub</h1>
          </div>
          <div className="flex items-center bg-zinc-800/70 px-3 py-1 rounded-full border border-zinc-700/50 shadow-lg shadow-red-900/5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-4 h-4 mr-1 text-amber-400 coin-icon">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="5" fill="currentColor" />
            </svg>
            <span className="text-sm font-medium text-amber-400">{profile.coins}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-200">Live Bets</h2>
          <div className="flex items-center text-xs text-zinc-400">
            <Clock size={14} className="mr-1" />
            <span>Live Feed</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {hotBets.map((bet) => (
            <div
              key={bet.id}
              className="p-4 bg-glass-dark rounded-lg border border-zinc-700/30 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 cursor-pointer hover-panel"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium text-zinc-200">{bet.title}</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-zinc-400">{bet.category}</span>
                    <span className="mx-2 w-1 h-1 bg-zinc-500 rounded-full"></span>
                    <div className="flex items-center text-xs text-red-400">
                      <Clock size={12} className="mr-1" />
                      {bet.time}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-amber-400">{bet.odds}</span>
                  <span className="text-xs text-zinc-400 mt-1">Odds</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="mt-6 w-full py-3 px-4 flex items-center justify-center text-base bg-glass-dark text-zinc-200 font-semibold rounded-lg border border-zinc-700/30 hover:bg-red-900/20 hover:border-red-500/30 transition-all duration-300 button-glow disabled:opacity-50"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-8 relative z-10">
        {/* Header with username */}
        <div className="flex items-center justify-between mb-8 border-b border-zinc-800/50 pb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-semibold text-zinc-200">
              Welcome back, <span className="text-red-400">{profile.username}</span>
            </h2>
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>

          {/* Top-Right Icons */}
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

        {/* Main Content Area - Top Half */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-glass-dark rounded-lg border border-zinc-700/30 p-6 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 cursor-pointer group hover-panel">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-zinc-200 group-hover:text-red-400 transition-colors duration-300">View Rooms</h3>
              <span className="px-3 py-1 text-xs bg-glass-dark text-zinc-300 rounded-full border border-zinc-600/30 group-hover:bg-red-900/20 group-hover:border-red-500/30 transition-all duration-300">5 Active</span>
            </div>
            <p className="text-zinc-400 mb-6">Access your current game rooms and continue where you left off.</p>
            <button
              onClick={() => navigate('/rooms')}
              className="w-full py-3 text-base bg-glass-dark hover:bg-red-900/20 text-zinc-200 font-semibold rounded-lg transition-all border border-zinc-600/30 hover:border-red-500/20 button-glow"
            >
              View My Rooms
            </button>
          </div>

          <div className="bg-glass-dark rounded-lg border border-zinc-700/30 p-6 hover:bg-glass-hover hover:border-red-500/20 transition-all duration-300 cursor-pointer group hover-panel">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-zinc-200 group-hover:text-red-400 transition-colors duration-300">Explore Rooms</h3>
              <span className="px-3 py-1 text-xs bg-glass-dark text-zinc-300 rounded-full border border-zinc-600/30 group-hover:bg-red-900/20 group-hover:border-red-500/30 transition-all duration-300">12 Public</span>
            </div>
            <p className="text-zinc-400 mb-6">Discover new gaming rooms and join communities with similar interests.</p>
            <button
              onClick={() => navigate('/explore')}
              className="w-full py-3 text-base bg-glass-dark hover:bg-red-900/20 text-zinc-200 font-semibold rounded-lg transition-all border border-zinc-600/30 hover:border-red-500/20 button-glow"
            >
              Explore Now
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="col-span-2 bg-glass-dark rounded-lg border border-zinc-700/30 p-6 hover:bg-glass-hover hover:border-red-500/10 transition-all duration-500 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-red-400 mr-2" />
                <h3 className="text-xl font-semibold text-zinc-200">Recent Activity</h3>
              </div>
              <span className="px-3 py-1 text-xs bg-glass-dark text-zinc-300 rounded-full border border-zinc-600/30">Live</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between bg-glass-dark rounded-lg p-4 border border-zinc-700/20 hover:bg-glass-hover hover:border-red-500/10 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${activity.bgColor} ${activity.textColor} flex items-center justify-center mr-3`}>
                      {activity.icon}
                    </div>
                    <div>
                      <span className="font-medium text-zinc-200">{activity.title}</span>
                      <p className="text-xs text-zinc-400 mt-1">{activity.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Friends Section */}
          <div className="bg-glass-dark rounded-lg border border-zinc-700/30 p-6 hover:bg-glass-hover hover:border-red-500/10 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-zinc-300 mr-2" />
                <h3 className="text-xl font-semibold text-zinc-200">Friends</h3>
              </div>
              <span className="px-3 py-1 text-xs bg-glass-dark text-zinc-300 rounded-full border border-zinc-600/30">2 Online</span>
            </div>
            <p className="text-zinc-400 mb-6">Connect with friends and invite them to your gaming rooms.</p>
            <button className="w-full py-3 text-base bg-glass-dark hover:bg-red-900/20 text-zinc-200 font-semibold rounded-lg transition-all border border-zinc-600/30 hover:border-red-500/20 button-glow">
              View All Friends
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}