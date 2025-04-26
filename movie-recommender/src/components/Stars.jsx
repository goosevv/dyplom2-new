// src/components/Stars.jsx
import React from 'react';

export default function Stars({ value, onChange }) {
  return (
    <div>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          style={{ cursor: 'pointer', color: n <= value ? 'gold' : '#ccc', fontSize: '1.2rem' }}
          onClick={() => onChange(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
