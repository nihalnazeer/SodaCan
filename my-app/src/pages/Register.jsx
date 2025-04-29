import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Register.css'; // Import Register-specific styles

function Register() {
  const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Basic validation
      if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
        throw new Error('All fields are required');
      }

      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = formData;
      const response = await api.register(registerData);
      
      setSuccess('Successfully registered! Redirecting to login...');
      localStorage.setItem('username', response.username || 'User');
      
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Register error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Left side: Registration form with enhanced gaming aesthetics */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-lg p-10 bg-zinc-900 rounded-lg shadow-lg border border-zinc-800" style={{minHeight: "600px"}}>
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
          
          <h2 className="text-3xl font-semibold text-zinc-200 mb-3">Join the Club</h2>
          <p className="text-zinc-400 mb-8">Create your SodaClub account</p>
          
          {error && (
            <div className="mb-6 p-4 text-sm text-red-300 bg-zinc-950 rounded-lg border border-red-900/50 animate-pulse">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 text-sm text-green-300 bg-zinc-950 rounded-lg border border-green-900/50 animate-pulse">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col justify-between" style={{minHeight: "380px"}}>
            <div>
              <div className="mb-5">
                <label htmlFor="email" className="block text-base font-medium text-zinc-200 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-4 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                  required
                />
              </div>
              
              <div className="mb-5">
                <label htmlFor="username" className="block text-base font-medium text-zinc-200 mb-2">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-4 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                  required
                />
              </div>
              
              <div className="mb-5">
                <label htmlFor="password" className="block text-base font-medium text-zinc-200 mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-4 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-base font-medium text-zinc-200 mb-2">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-4 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                  required
                />
              </div>
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-zinc-400 text-base">
            Already have an account?{' '}
            <Link to="/" className="text-red-400/80 hover:text-red-300 transition-colors font-medium">
              Login here
            </Link>
          </div>
        </div>
      </div>

      {/* Right side: Promotional content */}
      <div className="relative hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Animated background elements with gaming style */}
        <div className="absolute top-1/4 right-1/5 w-20 h-20 rounded-full bg-zinc-800/30 bubble"></div>
        <div className="absolute bottom-1/4 left-1/5 w-28 h-28 rounded-full bg-zinc-600/30 bubble"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-zinc-950/30 bubble"></div>
        
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
            <p className="text-sm text-zinc-400 font-medium helper-text mt-1">Level up your social life</p>
          </div>
        </div>

        {/* Community themed highlights */}
        <div className="mb-12">
          <h2 className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${animationState % 2 === 0 ? 'from-zinc-200 via-red-300/40 to-zinc-300' : 'from-zinc-300 via-red-400/30 to-zinc-400'} transition-colors duration-1000 mb-3 text-center`}>
            Join The Community
          </h2>
          <p className="text-zinc-400 text-lg text-center max-w-md mb-6">
            Create an account and become part of the fastest growing social gaming platform
          </p>
        </div>
        
        {/* Benefits cards */}
        <div className="grid grid-cols-2 gap-6 mb-12 max-w-lg">
          <div className="feature-card p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm hover:border-red-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="feature-icon p-2 bg-zinc-900 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-zinc-200 font-semibold">Make Connections</h3>
            </div>
            <p className="text-zinc-400 text-sm">Connect with players who share your gaming interests and competitive spirit</p>
          </div>
          
          <div className="feature-card p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm hover:border-red-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="feature-icon p-2 bg-zinc-900 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-zinc-200 font-semibold">Exclusive Events</h3>
            </div>
            <p className="text-zinc-400 text-sm">Get access to members-only competitions, tournaments, and special game events</p>
          </div>
          
          <div className="feature-card p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm hover:border-red-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="feature-icon p-2 bg-zinc-900 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-zinc-200 font-semibold">Secure Platform</h3>
            </div>
            <p className="text-zinc-400 text-sm">Play and compete with confidence on our secure, transparent platform</p>
          </div>
          
          <div className="feature-card p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm hover:border-red-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="feature-icon p-2 bg-zinc-900 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-zinc-200 font-semibold">Reward System</h3>
            </div>
            <p className="text-zinc-400 text-sm">Earn rewards, trophies, and climb leaderboards as you win challenges</p>
          </div>
        </div>
        
        {/* Testimonial quote */}
        <div className="max-w-md bg-zinc-900/60 rounded-xl p-6 border border-zinc-800 mb-8 backdrop-blur-sm hover:border-red-900/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
              <span className="text-zinc-300 text-xl font-bold">JS</span>
            </div>
            <div>
              <h4 className="text-zinc-200 font-medium">James Smith</h4>
              <p className="text-zinc-500 text-sm">Premium Member</p>
            </div>
          </div>
          <p className="text-zinc-400 italic">
            "SodaClub has completely changed how I enjoy sports with friends. The competitions are exciting and the community is incredibly welcoming!"
          </p>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-red-500/30"></div>
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
        </div>
      </div>
    </div>
  );
}

export default Register;