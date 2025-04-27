import React from 'react';

export function Button({ children, disabled, className }) {
  console.log('Rendering Button');
  return (
    <button
      disabled={disabled}
      className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}