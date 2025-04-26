// src/components/MovieGrid.jsx
import React from 'react';
import MovieCard from './MovieCard.jsx';
import './MovieGrid.css';

export default function MovieGrid({ movies }) {
  if (!movies.length) {
    return <p className="text-center mt-5">Нічого не знайдено.</p>;
  }
  return (
    <div className="movie-grid">
      {movies.map(m => (
        <MovieCard key={m.movieId} tmdbId={m.tmdb_id} title={m.title} />
      ))}
    </div>
  );
}
