import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './DashboardPage.css'; // Reuse Tailwind styles

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
    <div className="relative flex items-center justify-center min-h-screen bg-zinc-950">
      {/* Branding */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
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

      {/* Login Form */}
      <div className="relative z-20 w-full max-w-md p-8 bg-zinc-900 rounded-lg shadow-md border border-zinc-800">
        <h2 className="text-2xl font-semibold text-zinc-200 mb-2">Welcome Back</h2>
        <p className="text-zinc-400 mb-6">Log in to your SodaClub account</p>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-300 bg-zinc-950 rounded-lg border border-red-900/50">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-200 mb-1">Email</label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-200 mb-1">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-zinc-800 to-zinc-600 hover:from-zinc-700 hover:to-zinc-500 text-zinc-200 font-semibold rounded-lg transition-all shadow-md hover:shadow-zinc-700/30 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="mt-6 text-center text-zinc-400 text-sm">
          New to SodaClub?{' '}
          <Link to="/register" className="text-zinc-200 hover:text-white transition-colors font-medium">
            Create account
          </Link>
        </div>
      </div>
      <div className="absolute top-1/4 left-1/5 w-20 h-20 rounded-full bg-zinc-800/30 bubble"></div>
      <div className="absolute bottom-1/4 right-1/5 w-28 h-28 rounded-full bg-zinc-600/30 bubble"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-zinc-950/30 bubble"></div>
    </div>
  );
}

export default Login;