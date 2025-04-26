// movie-recommender/src/components/MovieCard.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API, authHeaders } from '../config'

export default function MovieCard({ movie }) {
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    // Определить, в избранном ли
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    setLiked(favs.includes(movie.movieId))
  }, [movie.movieId])

  const handleLike = async () => {
    let favs = JSON.parse(localStorage.getItem('favorites') || '[]')
    if (liked) {
      await axios.delete(`${API}/like/${movie.movieId}`, authHeaders())
      favs = favs.filter(id => id !== movie.movieId)
    } else {
      await axios.post(`${API}/like/${movie.movieId}`, null, authHeaders())
      favs.push(movie.movieId)
    }
    localStorage.setItem('favorites', JSON.stringify(favs))
    setLiked(!liked)
  }

  return (
    <div className="col">
      <div className="card h-100">
        <img
          src={movie.poster}
          className="card-img-top"
          alt={movie.title}
          style={{ objectFit: 'cover', height: '300px' }}
        />
        <div className="card-body">
          <h5 className="card-title">{movie.title}</h5>
          <p className="card-text text-muted">
            {movie.releaseDate} &bull; {movie.genre?.join(', ')}
          </p>
        </div>
        <div className="card-footer bg-white border-0 text-end">
          <button
            onClick={handleLike}
            className="btn btn-outline-danger"
            style={{ width: '40px', height: '40px', padding: 0 }}
          >
            {liked ? '💖' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  )
}


