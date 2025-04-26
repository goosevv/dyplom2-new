// src/pages/Recommendations.jsx
import React, { useState } from 'react'
import axios from 'axios'
import { API } from '../config'
import MovieCard from '../components/MovieCard'

export default function Recommendations() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    setError(null)
    try {
      const { data } = await axios.get(`${API}/search`, { params: { q: query } })
      setResults(data)
      setSelectedMovie(null)
    } catch (e) {
      console.error('Search error', e)
      setError('Помилка пошуку. Спробуйте інший запит.')
    }
  }

  const handleSelect = async (movie) => {
    setError(null)
    try {
      setSelectedMovie(movie)
      const { data } = await axios.get(`${API}/recommend/movie/${movie.movieId}`)
      setResults(data)
    } catch (e) {
      console.error('Recommend error', e)
      setError('Не вдалося завантажити рекомендації.')
    }
  }

  const reset = () => {
    setQuery('')
    setResults([])
    setSelectedMovie(null)
    setError(null)
  }

  return (
    <div className="container mt-4">
      <h2>Рекомендовані фільми</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Форма пошуку */}
      {!selectedMovie && (
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Введіть назву фільму"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            Знайти
          </button>
        </div>
      )}

      {/* Кнопка "назад" */}
      {selectedMovie && (
        <button className="btn btn-secondary mb-3" onClick={reset}>
          Повернутись до пошуку
        </button>
      )}

      {/* Сетка карточек */}
      <div className="row row-cols-1 row-cols-md-3 g-4 align-items-stretch">
        {results.map(movie => (
          <div
            key={movie.movieId}
            onClick={!selectedMovie ? () => handleSelect(movie) : undefined}
            style={{ cursor: !selectedMovie ? 'pointer' : 'default' }}
          >
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  )
}
