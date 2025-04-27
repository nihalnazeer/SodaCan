import React from 'react';

export function Form({ children, onSubmit, className }) {
  console.log('Rendering Form');
  return (
    <form onSubmit={onSubmit} className={`p-8 bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {children}
    </form>
  );
}