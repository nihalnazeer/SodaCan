import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Login.css'; // Import Login-specific styles

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(0);
  const navigate = useNavigate();

  // Welcome messages in different languages
  const welcomeMessages = [
    'Welcome',
    'ಸುಸ್ವಾಗತ',
    'സ്വാഗതം',
    'स्वागत है',
    'స్వాగతం'
  ];

  // Animation for welcome message
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLanguage((prev) => (prev + 1) % welcomeMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [welcomeMessages.length]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      const credentials = { email, password };
      const response = await api.login(credentials);
      console.log('Login response:', response);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('username', response.username || 'User');
      console.log('Stored access_token:', localStorage.getItem('access_token'));
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Left side: Promotional content */}
      <div className="relative hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/5 w-20 h-20 rounded-full bg-zinc-800/30 bubble"></div>
        <div className="absolute bottom-1/4 right-1/5 w-28 h-28 rounded-full bg-zinc-600/30 bubble"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-zinc-950/30 bubble"></div>
        
        {/* Branding */}
        <div className="flex items-center gap-4 mb-16">
          <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-600 border border-zinc-700 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-12 h-12">
              <path d="M7 4H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V4Z" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2V4" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 8H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 12H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 16H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-500">
              SodaClub
            </h1>
            <p className="text-sm text-zinc-400 font-medium">Spark your connections</p>
          </div>
        </div>
        
        {/* Animated welcome text */}
        <div className="text-center mb-16">
          <div className="text-7xl font-bold transition-all duration-500 ease-in-out text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-500">
            {welcomeMessages[currentLanguage]}
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="max-w-lg space-y-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium text-zinc-300">Create Private & Public Rooms</h3>
              <p className="text-zinc-400 mt-1">Connect with friends or meet new people in customizable rooms</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium text-zinc-300">Make Fun Bets With Friends</h3>
              <p className="text-zinc-400 mt-1">Create friendly wagers and track outcomes in real-time</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium text-zinc-300">Challenge Your Friends</h3>
              <p className="text-zinc-400 mt-1">Compete in games and activities to claim bragging rights</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side: Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-lg p-10 bg-zinc-900 rounded-lg shadow-lg border border-zinc-800" style={{minHeight: "540px"}}>
          {/* Mobile branding (visible only on small screens) */}
          <div className="flex md:hidden items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-600 border border-zinc-700 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path d="M7 4H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V4Z" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2V4" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 8H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 12H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 16H14" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-500">
                SodaClub
              </h1>
            </div>
          </div>
          
          <h2 className="text-3xl font-semibold text-zinc-200 mb-3">Welcome Back</h2>
          <p className="text-zinc-400 mb-8">Log in to your SodaClub account</p>
          
          {error && (
            <div className="mb-6 p-4 text-sm text-red-300 bg-zinc-950 rounded-lg border border-red-900/50">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col justify-between" style={{minHeight: "320px"}}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-base font-medium text-zinc-200 mb-2">Email</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
                required
              />
            </div>
            
            <div className="mb-8">
              <label htmlFor="password" className="block text-base font-medium text-zinc-200 mb-2">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-lg bg-gradient-to-r from-zinc-800 to-zinc-600 hover:from-zinc-700 hover:to-zinc-500 text-zinc-200 font-semibold rounded-lg transition-all shadow-md hover:shadow-zinc-700/30 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-zinc-400 text-base">
            New to SodaClub?{' '}
            <Link to="/register" className="text-zinc-200 hover:text-white transition-colors font-medium">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;