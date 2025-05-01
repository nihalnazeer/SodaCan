import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div className="flex min-h-screen bg-gradient">
      {/* Left side: Promotional content */}
      <div className="relative hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Subtle floating elements */}
        <div className="absolute top-1/4 left-1/5 w-20 h-20 rounded-full bg-bubble-1"></div>
        <div className="absolute bottom-1/4 right-1/5 w-28 h-28 rounded-full bg-bubble-2"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-bubble-3"></div>
        
        {/* Simplified Branding with more transparency */}
        <div className="flex items-center gap-5 mb-16">
          <div className="flex items-center justify-center w-20 h-20 rounded-full smooth-logo border shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-14 h-14">
              <path d="M7 4H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 16H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-5xl font-semibold text-transparent bg-clip-text bg-text-gradient">
              SodaClub
            </h1>
            <p className="text-sm font-medium helper-text mt-1">Spark your connections</p>
          </div>
        </div>
        
        {/* Simplified Activity Icons with more transparency */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {/* Sports Icon */}
          <div className="icon-container">
            <div className="p-6 bg-card rounded-2xl border shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
              <p className="mt-3 text-center font-medium">Sports</p>
            </div>
          </div>
          
          {/* Games Icon */}
          <div className="icon-container">
            <div className="p-6 bg-card rounded-2xl border shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 12h4" />
                <path d="M8 10v4" />
                <circle cx="17" cy="12" r="1" />
                <circle cx="15" cy="10" r="1" />
                <circle cx="19" cy="10" r="1" />
                <circle cx="15" cy="14" r="1" />
                <circle cx="19" cy="14" r="1" />
              </svg>
              <p className="mt-3 text-center font-medium">Games</p>
            </div>
          </div>
          
          {/* Social Icon */}
          <div className="icon-container">
            <div className="p-6 bg-card rounded-2xl border shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="mt-3 text-center font-medium">Community</p>
            </div>
          </div>
        </div>
        
        {/* Simplified Feature highlights with increased transparency */}
        <div className="max-w-lg space-y-8">
          <div className="feature-card flex items-start gap-4 group p-4 rounded-xl transition-all duration-300">
            <div className="feature-icon flex-shrink-0 p-3 rounded-lg border transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium transition-colors duration-300">Create Rooms</h3>
              <p className="mt-2 transition-colors duration-300">Set up private or public rooms to connect with friends</p>
            </div>
          </div>
          
          <div className="feature-card flex items-start gap-4 group p-4 rounded-xl transition-all duration-300">
            <div className="feature-icon flex-shrink-0 p-3 rounded-lg border transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium transition-colors duration-300">Real-time Challenges</h3>
              <p className="mt-2 transition-colors duration-300">Challenge your friends to games with instant results tracking</p>
            </div>
          </div>
          
          <div className="feature-card flex items-start gap-4 group p-4 rounded-xl transition-all duration-300">
            <div className="feature-icon flex-shrink-0 p-3 rounded-lg border transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-medium transition-colors duration-300">Track Wagers</h3>
              <p className="mt-2 transition-colors duration-300">Track your wagers in real-time with comprehensive statistics</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side: Login form with ultra-smooth transparent aesthetic */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-lg p-10 rounded-2xl shadow-sm border glass-effect" style={{minHeight: "540px"}}>
          {/* Mobile branding (visible only on small screens) */}
          <div className="flex md:hidden items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full smooth-logo border shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                <path d="M7 4H17V18C17 19.1046 16.1046 20 15 20H9C7.89543 20 7 19.1046 7 18V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 12H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 16H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-text-gradient">
                SodaClub
              </h1>
            </div>
          </div>
          
          <h2 className="text-3xl font-semibold text-heading mb-3">Welcome Back</h2>
          <p className="text-body mb-8">Log in to your SodaClub account</p>
          
          {error && (
            <div className="mb-6 p-4 text-sm text-error bg-error-bg rounded-lg border border-error/10">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col justify-between" style={{minHeight: "320px"}}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-base font-medium text-label mb-2">Email</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-lg bg-input text-input-text border border-input-border focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>
            
            <div className="mb-8">
              <label htmlFor="password" className="block text-base font-medium text-label mb-2">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-lg bg-input text-input-text border border-input-border focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="smooth-button w-full py-4 text-lg text-button-text font-semibold rounded-lg transition-all shadow-sm hover:shadow-primary/15 disabled:opacity-50"
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
          
          <div className="mt-8 text-center text-body text-base">
            New to SodaClub?{' '}
            <Link to="/register" className="text-primary hover:text-primary-hover transition-colors font-medium">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;