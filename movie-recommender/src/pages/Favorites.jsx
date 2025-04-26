// src/pages/FavoritesRecommendations.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { TMDB_KEY, TMDB_IMG_BASE, API_BASE } from "../config";

export default function FavoritesRecommendations() {
  const [recs, setRecs]     = useState([]);
  const [loading, setLoading] = useState(true);

  // Очистка title (примерно как раньше)
  const clean = (t) => t.replace(/\s*\(\d{4}\)$/,"").replace(/^(.+),\s*(The|A|An)$/i,"$2 $1");

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${API_BASE}/recommend/user/favorites`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // дополняем постерами
        const withPost = await Promise.all(
          data.map(async (r) => {
            const q = clean(r.title);
            const res = await axios.get(
              "https://api.themoviedb.org/3/search/movie",
              { params: { api_key: TMDB_KEY, query: q } }
            );
            const arr = res.data.results;
            return {
              ...r,
              poster: arr.length
                ? TMDB_IMG_BASE + arr[0].poster_path
                : "/placeholder.png"
            };
          })
        );
        setRecs(withPost);
      } catch {
        setRecs([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p>Завантаження рекомендацій…</p>;
  if (!recs.length) return <p>Порад під ваші вподобання не знайдено.</p>;

  return (
    <div className="container mt-4">
      <h2>Рекомендації за Вашими Favorites</h2>
      <div className="row">
        {recs.map((r) => (
          <div key={r.movieId} className="col-md-3 mb-4">
            <div className="card h-100">
              <img
                src={r.poster}
                className="card-img-top"
                style={{ height: 200, objectFit: "cover" }}
              />
              <div className="card-body">
                <h6 className="card-title">{r.title}</h6>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
