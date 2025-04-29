import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Login.css'; // Import Login-specific styles

// Add these styles to Login.css:
/*
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animated-logo {
  background: linear-gradient(-45deg, #313134, #414144, #222224, #5a5a5e);
  background-size: 400% 400%;
  animation: gradientShift 6s ease infinite;
  transition: all 0.3s ease;
}

.animated-logo:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px -5px rgba(201, 38, 38, 0.3);
}

.logo-pulse {
  animation: logoPulse 3s ease-in-out infinite;
}

@keyframes logoPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
*/

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Animation state for gradient effects
  const [animationState, setAnimationState] = useState(0);
  const navigate = useNavigate();

  // Use animation state for gradient and UI element animations
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationState((prev) => (prev + 1) % 4); // Cycle through 4 states for animations
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
        {/* Animated background elements with gaming style */}
        <div className="absolute top-1/4 left-1/5 w-20 h-20 rounded-full bg-zinc-800/30 bubble"></div>
        <div className="absolute bottom-1/4 right-1/5 w-28 h-28 rounded-full bg-zinc-600/30 bubble"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-zinc-950/30 bubble"></div>
        
        {/* Enhanced Branding with animated gradient logo */}
        <div className="flex items-center gap-5 mb-16 logo-container">
          <div className={`flex items-center justify-center w-20 h-20 rounded-lg animated-logo border border-zinc-700/80 shadow-lg hover:shadow-red-900/30 transition-all duration-300 logo-pulse ${animationState === 1 ? 'border-red-700/30' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-14 h-14">
              <path d="M7 4H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V4Z" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2V4" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 8H14" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 12H14" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 16H14" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className={`text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r ${animationState % 2 === 0 ? 'from-zinc-200 via-red-300/40 to-zinc-400' : 'from-zinc-300 via-red-400/30 to-zinc-500'} transition-colors duration-1000`}>
              SodaClub
            </h1>
            <p className="text-sm text-zinc-400 font-medium helper-text mt-1">Spark your connections</p>
          </div>
        </div>
        
        {/* Sports, Games, and Betting Icons */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {/* Sports Icon */}
          <div className="icon-container icon-float">
            <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg relative">
              <div className="icon-glow"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
              <p className="mt-3 text-center text-zinc-400 font-medium">Sports</p>
            </div>
          </div>
          
          {/* Games Icon */}
          <div className="icon-container icon-float">
            <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg relative">
              <div className="icon-glow"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 12h4" />
                <path d="M8 10v4" />
                <circle cx="17" cy="12" r="1" />
                <circle cx="15" cy="10" r="1" />
                <circle cx="19" cy="10" r="1" />
                <circle cx="15" cy="14" r="1" />
                <circle cx="19" cy="14" r="1" />
              </svg>
              <p className="mt-3 text-center text-zinc-400 font-medium">Games</p>
            </div>
          </div>
          
          {/* Betting Icon */}
          <div className="icon-container icon-float">
            <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg relative">
              <div className="icon-glow"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
                <path d="M12 6v2" />
                <path d="M12 16v2" />
              </svg>
              <p className="mt-3 text-center text-zinc-400 font-medium">Betting</p>
            </div>
          </div>
          
          {/* Community Icon */}
          <div className="icon-container icon-float">
            <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg relative">
              <div className="icon-glow"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="mt-3 text-center text-zinc-400 font-medium">Community</p>
            </div>
          </div>
        </div>
        
        {/* Enhanced Feature highlights with better animations */}
        <div className="max-w-lg space-y-8">
          <div className="feature-card flex items-start gap-4 group p-4 rounded-xl transition-all duration-300">
            <div className="feature-icon flex-shrink-0 p-3 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-red-700/40 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-400 group-hover:text-red-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium text-zinc-300 group-hover:text-red-300 transition-colors duration-300">Create Sports Betting Rooms</h3>
              <p className="text-zinc-400 mt-2 group-hover:text-zinc-300 transition-colors duration-300">Set up private or public rooms to bet on your favorite sports events with friends</p>
            </div>
          </div>
          
          <div className="feature-card flex items-start gap-4 group p-4 rounded-xl transition-all duration-300">
            <div className="feature-icon flex-shrink-0 p-3 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-red-700/40 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-400 group-hover:text-red-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium text-zinc-300 group-hover:text-red-300 transition-colors duration-300">Real-time Challenges & Competitions</h3>
              <p className="text-zinc-400 mt-2 group-hover:text-zinc-300 transition-colors duration-300">Challenge your friends to games and competitions with instant results tracking</p>
            </div>
          </div>
          
          <div className="feature-card flex items-start gap-4 group p-4 rounded-xl transition-all duration-300">
            <div className="feature-icon flex-shrink-0 p-3 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-red-700/40 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-400 group-hover:text-red-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium text-zinc-300 group-hover:text-red-300 transition-colors duration-300">Place Bets & Track Wagers</h3>
              <p className="text-zinc-400 mt-2 group-hover:text-zinc-300 transition-colors duration-300">Track your bets and wagers in real-time with comprehensive statistics and history</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side: Login form with enhanced gaming aesthetics */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-lg p-10 bg-zinc-900 rounded-lg shadow-lg border border-zinc-800" style={{minHeight: "540px"}}>
          {/* Mobile branding (visible only on small screens) */}
          <div className="flex md:hidden items-center gap-4 mb-6 logo-container">
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg animated-logo border border-zinc-700/80 shadow-md ${animationState === 1 ? 'border-red-700/30' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                <path d="M7 4H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V4Z" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2V4" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 8H14" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 12H14" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 16H14" stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className={`text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r ${animationState % 2 === 0 ? 'from-zinc-200 via-red-300/40 to-zinc-400' : 'from-zinc-300 via-red-400/30 to-zinc-500'} transition-colors duration-1000`}>
                SodaClub
              </h1>
            </div>
          </div>
          
          <h2 className="text-3xl font-semibold text-zinc-200 mb-3">Welcome Back</h2>
          <p className="text-zinc-400 mb-8">Log in to your SodaClub account</p>
          
          {error && (
            <div className="mb-6 p-4 text-sm text-red-300 bg-zinc-950 rounded-lg border border-red-900/50 animate-pulse">
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
                className="w-full p-4 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
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
                className="w-full p-4 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="button-glow w-full py-4 text-lg animated-gradient-button text-zinc-200 font-semibold rounded-lg transition-all shadow-md hover:shadow-red-900/20 disabled:opacity-50"
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
            <Link to="/register" className="text-red-400/80 hover:text-red-300 transition-colors font-medium">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;