// movie-recommender/src/pages/Recommendations.jsx
import React, { useState } from 'react'
import axios from 'axios'
import MovieCard from '../components/MovieCard'
import { API } from '../config'

export default function Recommendations() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  const handleSearch = async () => {
    try {
      const res = await axios.get(`${API}/search`, { params: { q: query } })
      setSearchResults(res.data)
      setSelectedMovie(null)
      setRecommendations([])
    } catch (err) {
      console.error('Search error:', err)
    }
  }

  const handleSelect = async (movie) => {
    setSelectedMovie(movie)
    setSearchResults([])
    try {
      const res = await axios.get(`${API}/recommend/movie/${movie.movieId}`)
      setRecommendations(res.data)
    } catch (err) {
      console.error('Recommendation error:', err)
    }
  }

  return (
    <div className="container mt-4">
      <h2>Рекомендовані фільми</h2>

      <div className="d-flex mb-3">
        <input
          type="text"
          className="form-control me-2"
          placeholder="Введіть назву фільму"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSearch}>
          Знайти
        </button>
      </div>

      {searchResults.length > 0 && (
        <ul className="list-group mb-3">
          {searchResults.map(m => (
            <li
              key={m.movieId}
              className="list-group-item list-group-item-action"
              onClick={() => handleSelect(m)}
              style={{ cursor: 'pointer' }}
            >
              {m.title}
            </li>
          ))}
        </ul>
      )}

      {selectedMovie && (
        <div className="mb-3">
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedMovie(null)}
          >
            Повернутись до пошуку
          </button>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {recommendations.map(m => (
            <div className="col" key={m.movieId}>
              <MovieCard movie={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
