import React from 'react';

export function Input({ type, placeholder, value, onChange, label, error }) {
  console.log('Rendering Input', { label });
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 bg-gray-700 text-white rounded-lg border ${
          error ? 'border-red-500' : 'border-gray-600'
        } focus:outline-none focus:border-blue-500`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}