```jsx
import React from 'react';
import PropTypes from 'prop-types';

function Header({ coins, handleLogout }) {
  return (
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l-.06-.06a2 2 0 0 1 2.83 0 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
  );
}

Header.propTypes = {
  coins: PropTypes.number.isRequired,
  handleLogout: PropTypes.func.isRequired,
};

export default Header;