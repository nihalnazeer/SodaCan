import React from 'react';

export function FormHeader({ title }) {
  console.log('Rendering FormHeader');
  return (
    <h2 className="text-2xl font-bold text-white text-center mb-6">{title}</h2>
  );
}