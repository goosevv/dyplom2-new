import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container mt-5 text-center">
      <h1>Вітаємо в MovieReco</h1>
      <div className="mt-4">
        <Link className="btn btn-primary me-2" to="/login">Увійти</Link>
        <Link className="btn btn-secondary" to="/register">Зареєструватися</Link>
      </div>
    </div>
  );
}
