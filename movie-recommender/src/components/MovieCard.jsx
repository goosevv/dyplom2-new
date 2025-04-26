// src/components/MovieCard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MovieCard.css';
import { TMDB_KEY, TMDB_IMG_BASE, API_BASE } from '../config';

export default function MovieCard({ tmdbId, title }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    // Загружаем детали фильма (описание, жанры и дату)
    axios
      .get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
        params: { api_key: TMDB_KEY, language: 'uk-UA' }
      })
      .then(r => setDetails(r.data))
      .catch(() => setDetails({ overview: 'Немає опису', genres: [], release_date: '' }));
  }, [tmdbId]);

  const posterUrl = details && details.poster_path
    ? TMDB_IMG_BASE + details.poster_path
    : '/placeholder.png';

  const releaseYear = details?.release_date?.slice(0, 4) || '–––';
  const genres = details?.genres?.map(g => g.name).join(', ') || 'Жанри невідомі';
  const overview = details?.overview || '';

  return (
    <div className="movie-card">
      <img src={posterUrl} alt={title} className="poster" />
      <div className="info">
        <h6 className="movie-title">{title}</h6>
      </div>
      <div className="overlay">
        <div className="overlay-content">
          <p className="movie-year">{releaseYear}</p>
          <p className="movie-genres">{genres}</p>
          <p className="movie-overview">{overview}</p>
        </div>
      </div>
    </div>
  );
}
