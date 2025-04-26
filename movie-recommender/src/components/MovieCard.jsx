// src/components/MovieCard.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  API,
  authHeaders,
  TMDB_KEY,
  TMDB_API_BASE,
  TMDB_IMG_BASE
} from '../config'

let genreMap = {}
async function loadGenres() {
  if (Object.keys(genreMap).length) return
  try {
    const res = await axios.get(`${TMDB_API_BASE}/genre/movie/list`, {
      params: { api_key: TMDB_KEY, language: 'uk-UA' }
    })
    res.data.genres.forEach(g => (genreMap[g.id] = g.name))
  } catch {}
}

export default function MovieCard({ movie, onClickCard }) {
  const [details, setDetails] = useState(null)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    loadGenres()
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    setLiked(favs.includes(movie.movieId))

    const titleNoYear = movie.title.replace(/\s*\(\d{4}\)$/, '')
    const yearMatch = movie.title.match(/\((\d{4})\)$/)
    const params = { api_key: TMDB_KEY, query: titleNoYear, language: 'uk-UA' }
    if (yearMatch) params.year = yearMatch[1]

    axios
      .get(`${TMDB_API_BASE}/search/movie`, { params })
      .then(({ data }) => setDetails(data.results?.[0] || {}))
      .catch(() => setDetails({}))
  }, [movie.movieId])

  const toggleLike = async (e) => {
    e.stopPropagation()
    if (liked) {
      await axios.delete(`${API}/like/${movie.movieId}`, authHeaders())
    } else {
      await axios.post(`${API}/like/${movie.movieId}`, null, authHeaders())
    }
    let favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    favs = liked
      ? favs.filter(id => id !== movie.movieId)
      : [...favs, movie.movieId]
    localStorage.setItem('favorites', JSON.stringify(favs))
    setLiked(!liked)
  }

  if (details === null) {
    return (
      <div className="col d-flex">
        <div className="card flex-fill d-flex flex-column">
          <div className="card-body d-flex justify-content-center align-items-center">
            Завантаження…
          </div>
        </div>
      </div>
    )
  }

  const poster = details.poster_path
    ? `${TMDB_IMG_BASE}${details.poster_path}`
    : '/placeholder.png'
  const year = (details.release_date || '').slice(0, 4)
  const ids = details.genre_ids || details.genres?.map(g => g.id) || []
  const genres = ids.map(id => genreMap[id]).filter(Boolean).join(', ')

  return (
    <div
      className="col d-flex"
      onClick={onClickCard}
      style={{ cursor: onClickCard ? 'pointer' : 'default' }}
    >
      <div className="card flex-fill d-flex flex-column">
        <img
          src={poster}
          className="card-img-top"
          alt={details.title}
          style={{ objectFit: 'cover', height: '300px' }}
        />
        <div className="card-body flex-grow-1 d-flex flex-column">
          <h5 className="card-title">{details.title}</h5>
          <p className="card-text text-muted mt-auto">
            {year} {genres && <>• {genres}</>}
          </p>
        </div>
        <div className="card-footer bg-white border-top-0 text-end">
          <button
            className="btn btn-outline-danger"
            onClick={toggleLike}
          >
            {liked ? '💖' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  )
}
